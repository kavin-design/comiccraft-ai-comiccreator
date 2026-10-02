"""ComicCraft FastAPI Routes Module with Unified Single Gemini API Key.

Defines the endpoints and core pipeline coordinator for generating,
previewing, downloading, and testing 5-panel AI comic strips using a single mandatory
Google Gemini API key for outline, story, and illustrations.
Part of the Naan Mudhalvan academic submission for ComicCraft.
"""

import logging
import os
import time
import traceback
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from fastapi import APIRouter, Form, HTTPException, Query, Request
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, Field, field_validator

from app.config import (
    ALLOWED_SETTINGS,
    ALLOWED_STYLES,
    ALLOWED_TONES,
    BASE_DIR,
    EXPORTS_DIR,
    GEMINI_FLASH_MODEL,
    GEMINI_PRO_MODEL,
    IMAGEN_MODEL,
    TEMPLATES_DIR,
    ComicGenerationError,
    resolve_gemini_key,
    update_env_api_key,
)
from app.exporters import save_pdf
from app.gemini_flash import generate_outline
from app.gemini_pro import LAST_USED_STORY_MODEL, generate_story
from app.image_generator import generate_image
from app.layout_builder import build_comic_layout

logger = logging.getLogger(__name__)

router = APIRouter()
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))


# -----------------------------------------------------------------------------
# Pydantic Request Models for JSON Endpoint
# -----------------------------------------------------------------------------
class PromptRequest(BaseModel):
    """Validation schema for the POST /generate-comic/json API endpoint."""

    prompt: str = Field(..., min_length=5, description="Story premise or idea")
    character_name: str = Field(default="Hero", description="Main protagonist name")
    setting: str = Field(default="Forest", description="Setting of the story")
    tone: str = Field(default="Light-hearted", description="Tone of the story")
    style: str = Field(default="Comic Book", description="Visual art style")
    gemini_api_key: str = Field(..., min_length=5, description="Mandatory Google Gemini API Key")

    @field_validator("setting")
    @classmethod
    def validate_setting(cls, v: str) -> str:
        matched = next((s for s in ALLOWED_SETTINGS if s.lower() == v.lower()), None)
        if not matched:
            raise ValueError(f"Invalid setting '{v}'. Allowed options: {ALLOWED_SETTINGS}")
        return matched

    @field_validator("tone")
    @classmethod
    def validate_tone(cls, v: str) -> str:
        matched = next((t for t in ALLOWED_TONES if t.lower() == v.lower()), None)
        if not matched:
            raise ValueError(f"Invalid tone '{v}'. Allowed options: {ALLOWED_TONES}")
        return matched

    @field_validator("style")
    @classmethod
    def validate_style(cls, v: str) -> str:
        matched = next((s for s in ALLOWED_STYLES if s.lower() == v.lower()), None)
        if not matched:
            raise ValueError(f"Invalid style '{v}'. Allowed options: {ALLOWED_STYLES}")
        return matched


# -----------------------------------------------------------------------------
# Shared Comic Pipeline Runner
# -----------------------------------------------------------------------------
def run_comic_pipeline(
    prompt: str,
    character_name: str,
    setting: str,
    tone: str,
    style: str,
    gemini_api_key: str,
) -> Tuple[List[Dict[str, Any]], str, Dict[str, Any]]:
    """Executes the full 5-step comic generation pipeline sequentially using the single Gemini API Key.

    1. Validates and saves the mandatory Gemini API key.
    2. generate_outline (Gemini Flash).
    3. generate_story (Gemini Pro).
    4. generate_image per panel (Gemini Imagen / Comic Art).
    5. build_comic_layout (Assemble dialogue and artwork).
    6. save_pdf (Export high-res multi-page PDF).

    Returns:
        Tuple of (layout list, web-safe pdf path, metadata dict).
    """
    if not gemini_api_key or not gemini_api_key.strip():
        raise ComicGenerationError("Google Gemini API Key is mandatory to create your comic.", stage="auth")

    total_start = time.time()
    comic_id = str(uuid.uuid4())[:8]

    # Save and persist the user's Gemini API key
    cleaned_key = gemini_api_key.strip()
    update_env_api_key(gemini_key=cleaned_key)
    active_gemini_key = resolve_gemini_key(cleaned_key)

    # Combine prompt according to project specification
    combined_prompt = (
        f"{prompt.strip()}\n"
        f"The main character is {character_name.strip()}. "
        f"The setting is a {setting.strip()}. "
        f"The tone is {tone.strip()}. "
        f"The art style is {style.strip()}."
    )

    meta = {
        "comic_id": comic_id,
        "prompt": prompt.strip(),
        "character_name": character_name.strip(),
        "setting": setting.strip(),
        "tone": tone.strip(),
        "style": style.strip(),
        "models_used": {
            "outline": GEMINI_FLASH_MODEL,
            "story": LAST_USED_STORY_MODEL,
            "image": IMAGEN_MODEL,
        },
    }

    # Step 1: Outline (Gemini Flash)
    t0 = time.time()
    outline = generate_outline(combined_prompt, api_key=active_gemini_key)
    outline_duration = time.time() - t0
    logger.info("[%s] Step 1 (Outline) completed in %.2fs", comic_id, outline_duration)

    # Step 2: Story & Dialogue (Gemini Pro)
    t0 = time.time()
    full_story = generate_story(
        outline,
        character_name=character_name,
        tone=tone,
        api_key=active_gemini_key,
    )
    story_duration = time.time() - t0
    logger.info("[%s] Step 2 (Story) completed in %.2fs", comic_id, story_duration)

    # Step 3: Illustrations (1 per panel via single Gemini key / Imagen)
    t0 = time.time()
    image_paths: List[str] = []
    comic_seed = abs(hash(comic_id)) % (2**31)

    for idx, panel_item in enumerate(outline):
        panel_num = panel_item.get("panel", idx + 1)
        img_prompt = panel_item.get("image_prompt", "")
        img_filename = f"panel_{panel_num}.png"

        path_generated = generate_image(
            prompt=img_prompt,
            filename=img_filename,
            comic_id=comic_id,
            style=style,
            seed=comic_seed,
            gemini_api_key=active_gemini_key,
        )
        image_paths.append(path_generated)

    images_duration = time.time() - t0
    logger.info("[%s] Step 3 (5 Panels Generated) completed in %.2fs", comic_id, images_duration)

    # Step 4: Layout Assembly
    t0 = time.time()
    layout = build_comic_layout(image_paths, full_story, outline)
    layout_duration = time.time() - t0
    logger.info("[%s] Step 4 (Layout) assembled in %.2fs", comic_id, layout_duration)

    # Step 5: PDF Export
    t0 = time.time()
    pdf_rel_path = save_pdf(layout, meta=meta)
    pdf_duration = time.time() - t0
    logger.info("[%s] Step 5 (PDF) saved in %.2fs to %s", comic_id, pdf_duration, pdf_rel_path)

    # Ensure leading slash for web safety: '/static/exports/...'
    web_pdf_path = f"/{pdf_rel_path.lstrip('/')}"

    total_time = time.time() - total_start
    logger.info("[%s] Full comic generation pipeline finished in %.2fs", comic_id, total_time)

    # Update metadata with actual model used
    meta["models_used"]["story"] = LAST_USED_STORY_MODEL

    return layout, web_pdf_path, meta


# -----------------------------------------------------------------------------
# Web Routes
# -----------------------------------------------------------------------------
@router.get("/", response_class=HTMLResponse)
def index_view(request: Request):
    """Renders index.html with option dropdowns and saved Gemini API Key."""
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "settings": ALLOWED_SETTINGS,
            "tones": ALLOWED_TONES,
            "styles": ALLOWED_STYLES,
            "default_prompt": "A brave fox exploring an enchanted forest discovers a magical glowing tree",
            "default_character": "Rusty the Fox",
            "default_setting": "Forest",
            "default_tone": "Light-hearted",
            "default_style": "Comic Book",
            "saved_gemini_api_key": resolve_gemini_key(),
            "error": None,
        },
    )


@router.post("/generate", response_class=HTMLResponse)
def generate_comic_form(
    request: Request,
    prompt: str = Form(...),
    character_name: str = Form(...),
    setting: str = Form(...),
    tone: str = Form(...),
    style: str = Form(...),
    gemini_api_key: Optional[str] = Form(None),
):
    """Form submission route: runs pipeline and renders comic_preview.html.

    Enforces mandatory Google Gemini API Key input.
    On error, re-renders index.html preserving user inputs with a friendly banner.
    """
    if not gemini_api_key or not gemini_api_key.strip():
        return templates.TemplateResponse(
            request=request,
            name="index.html",
            context={
                "settings": ALLOWED_SETTINGS,
                "tones": ALLOWED_TONES,
                "styles": ALLOWED_STYLES,
                "default_prompt": prompt,
                "default_character": character_name,
                "default_setting": setting,
                "default_tone": tone,
                "default_style": style,
                "saved_gemini_api_key": "",
                "error": "Google Gemini API Key is mandatory to generate your comic. Please enter your API key.",
            },
            status_code=200,
        )

    try:
        layout, pdf_path, meta = run_comic_pipeline(
            prompt=prompt,
            character_name=character_name,
            setting=setting,
            tone=tone,
            style=style,
            gemini_api_key=gemini_api_key,
        )

        return templates.TemplateResponse(
            request=request,
            name="comic_preview.html",
            context={
                "layout": layout,
                "pdf_path": pdf_path,
                "meta": meta,
                "prompt": prompt,
                "character_name": character_name,
                "setting": setting,
                "tone": tone,
                "style": style,
                "gemini_api_key": gemini_api_key,
                "settings": ALLOWED_SETTINGS,
                "tones": ALLOWED_TONES,
                "styles": ALLOWED_STYLES,
                "models_used": meta.get("models_used", {}),
            },
        )

    except Exception as exc:
        logger.error("Error generating comic via web form:\n%s", traceback.format_exc())
        return templates.TemplateResponse(
            request=request,
            name="index.html",
            context={
                "settings": ALLOWED_SETTINGS,
                "tones": ALLOWED_TONES,
                "styles": ALLOWED_STYLES,
                "default_prompt": prompt,
                "default_character": character_name,
                "default_setting": setting,
                "default_tone": tone,
                "default_style": style,
                "saved_gemini_api_key": gemini_api_key,
                "error": f"Failed to generate comic: {str(exc)}",
            },
            status_code=200,
        )


@router.post("/generate-comic/json")
def generate_comic_json(req: PromptRequest):
    """Pydantic-validated JSON endpoint returning comic_id, layout, pdf_path, and models_used."""
    try:
        layout, pdf_path, meta = run_comic_pipeline(
            prompt=req.prompt,
            character_name=req.character_name,
            setting=req.setting,
            tone=req.tone,
            style=req.style,
            gemini_api_key=req.gemini_api_key,
        )

        return JSONResponse(
            status_code=200,
            content={
                "comic_id": meta["comic_id"],
                "layout": layout,
                "pdf_path": pdf_path,
                "models_used": meta["models_used"],
            },
        )

    except Exception as exc:
        logger.error("JSON pipeline error: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


class ApiKeySettingsRequest(BaseModel):
    """Request model for updating the single Gemini API key."""
    gemini_api_key: str = Field(..., min_length=5, description="Google Gemini API Key")


@router.post("/api/settings/keys")
def set_api_keys_endpoint(settings_req: ApiKeySettingsRequest):
    """Updates and saves user-provided Gemini API key into .env and runtime."""
    update_env_api_key(gemini_key=settings_req.gemini_api_key)
    return {
        "status": "success",
        "message": "Gemini API key updated and persisted successfully.",
        "gemini_configured": bool(resolve_gemini_key()),
    }


@router.get("/api/settings/keys")
def get_api_keys_status():
    """Returns configuration status of the Gemini API key without exposing secret contents."""
    return {
        "gemini_configured": bool(resolve_gemini_key()),
    }


@router.get("/download")
def download_pdf(pdf_path: str = Query(..., description="Path to the PDF file")):
    """Returns the generated comic PDF as a browser download attachment.

    Guards against path traversal attacks.
    """
    clean_path = pdf_path.strip().lstrip("/")
    resolved = (BASE_DIR / clean_path).resolve()
    exports_resolved = EXPORTS_DIR.resolve()

    # Block path traversal outside static/exports/
    try:
        resolved.relative_to(exports_resolved)
    except ValueError:
        logger.warning("Path traversal attempt blocked: %s", pdf_path)
        raise HTTPException(status_code=403, detail="Access denied: invalid file path.")

    if not resolved.exists() or not resolved.is_file():
        raise HTTPException(status_code=404, detail="Requested PDF file not found.")

    filename = resolved.name
    return FileResponse(
        path=str(resolved),
        filename=filename,
        media_type="application/pdf",
    )


@router.get("/export-success", response_class=HTMLResponse)
def export_success_view(request: Request, pdf_path: str = Query("")):
    """Renders export_success.html after PDF download completes."""
    filename = Path(pdf_path).name if pdf_path else "comic.pdf"
    clean_web_path = f"/{pdf_path.lstrip('/')}" if pdf_path else ""

    return templates.TemplateResponse(
        request=request,
        name="export_success.html",
        context={
            "filename": filename,
            "pdf_path": clean_web_path,
        },
    )


@router.get("/test-image")
def test_image_endpoint(
    prompt: str = Query(
        "A futuristic city at sunset, sci-fi, cinematic, artstation",
        description="Prompt for image generation test",
    )
):
    """Generates a single test image using the single Gemini API key."""
    test_id = "test_" + str(uuid.uuid4())[:6]
    image_rel_path = generate_image(prompt=prompt, comic_id=test_id, filename="test_panel.png")

    return {
        "message": "Image generated successfully",
        "path": f"/{image_rel_path.lstrip('/')}",
    }


@router.get("/health")
def health_endpoint():
    """Returns the active Gemini models."""
    return {
        "status": "healthy",
        "gemini_flash_model": GEMINI_FLASH_MODEL,
        "gemini_pro_model": GEMINI_PRO_MODEL,
        "imagen_model": IMAGEN_MODEL,
        "gemini_key_configured": bool(resolve_gemini_key()),
    }
