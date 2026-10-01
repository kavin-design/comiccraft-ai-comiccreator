"""Image Generation Module using Single Google Gemini API Key.

Provides visual comic panel generation using Google GenAI Imagen models
via the unified GEMINI_API_KEY, with automatic Pillow comic illustration fallback.
Completely removes complex Hugging Face and local Stable Diffusion model requirements.

Part of the Naan Mudhalvan academic submission for ComicCraft.
"""

import io
import logging
import os
import re
import uuid
from pathlib import Path
from typing import Optional

from PIL import Image, ImageDraw, ImageFont
from google import genai

from app.config import (
    FONTS_DIR,
    IMAGEN_MODEL,
    PANELS_DIR,
    STYLE_MAP,
    resolve_gemini_key,
)

logger = logging.getLogger(__name__)


def sanitize_filename(name: str) -> str:
    """Sanitizes a string for safe usage in file paths."""
    sanitized = re.sub(r"[^\w\s-]", "", name).strip().lower()
    sanitized = re.sub(r"[-\s]+", "_", sanitized)
    return sanitized or "panel"


def _draw_placeholder_panel(
    prompt: str, output_path: Path, style: str = "", panel_title: str = ""
) -> None:
    """Draws a rich 512x512 comic illustration panel using Pillow.

    Ensures the generation pipeline never crashes and outputs visual panel art.
    """
    width, height = 512, 512
    img = Image.new("RGB", (width, height), "#1e293b")
    draw = ImageDraw.Draw(img)

    # Style-specific color themes
    style_colors = {
        "anime": ((15, 23, 42), (59, 130, 246), (236, 72, 153)),
        "comic book": ((15, 23, 42), (234, 179, 8), (239, 68, 68)),
        "pixel art": ((15, 23, 42), (16, 185, 129), (99, 102, 241)),
        "realistic": ((15, 23, 42), (71, 85, 105), (148, 163, 184)),
    }
    top_c, mid_c, bot_c = style_colors.get(style.lower(), style_colors["comic book"])

    # Draw vertical smooth gradient
    for y in range(height):
        factor = y / float(height)
        if factor < 0.5:
            t = factor * 2.0
            r = int(top_c[0] * (1 - t) + mid_c[0] * t)
            g = int(top_c[1] * (1 - t) + mid_c[1] * t)
            b = int(top_c[2] * (1 - t) + mid_c[2] * t)
        else:
            t = (factor - 0.5) * 2.0
            r = int(mid_c[0] * (1 - t) + bot_c[0] * t)
            g = int(mid_c[1] * (1 - t) + bot_c[1] * t)
            b = int(mid_c[2] * (1 - t) + bot_c[2] * t)
        draw.line([(0, y), (width, y)], fill=(r, g, b))

    # Inner comic border
    draw.rectangle([12, 12, width - 12, height - 12], outline="#0f172a", width=6)
    draw.rectangle([18, 18, width - 18, height - 18], outline="#f8fafc", width=2)

    # Load custom font or fallback to default
    font_bold = None
    font_regular = None
    bold_path = FONTS_DIR / "DejaVuSans-Bold.ttf"
    reg_path = FONTS_DIR / "DejaVuSans.ttf"

    if bold_path.exists():
        try:
            font_bold = ImageFont.truetype(str(bold_path), 22)
            font_regular = ImageFont.truetype(str(reg_path), 14)
        except Exception:
            pass

    if font_bold is None:
        font_bold = ImageFont.load_default()
        font_regular = ImageFont.load_default()

    # Panel Banner Header
    display_title = panel_title.strip() if panel_title else "COMIC SCENE"
    draw.rectangle([30, 30, width - 30, 85], fill="#0f172a")
    draw.rectangle([34, 34, width - 34, 81], outline="#eab308", width=2)
    draw.text((width / 2, 57), display_title.upper(), fill="#fef08a", font=font_bold, anchor="mm")

    # Center Visual Badge
    draw.ellipse([width / 2 - 70, height / 2 - 70, width / 2 + 70, height / 2 + 70], fill="#0f172a", outline="#e2e8f0", width=4)
    draw.text((width / 2, height / 2 - 10), "★ COMIC ★", fill="#fbbf24", font=font_bold, anchor="mm")
    draw.text((width / 2, height / 2 + 20), style.upper() or "SCENE", fill="#94a3b8", font=font_regular, anchor="mm")

    # Prompt summary box at bottom
    clean_prompt = prompt.replace("\n", " ").strip()
    words = clean_prompt.split()
    snippet = " ".join(words[:14]) + ("..." if len(words) > 14 else "")

    draw.rectangle([30, height - 90, width - 30, height - 30], fill="#0f172a")
    draw.rectangle([32, height - 88, width - 32, height - 32], outline="#64748b", width=1)
    draw.text((width / 2, height - 60), snippet, fill="#f8fafc", font=font_regular, anchor="mm")

    # Save PNG
    output_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(str(output_path), "PNG")


def _generate_gemini_imagen(
    prompt: str, output_path: Path, api_key: str
) -> bool:
    """Generates an image via Google GenAI Imagen models using the single Gemini API Key."""
    try:
        client = genai.Client(api_key=api_key)
        logger.info("Attempting Imagen generation with model: %s", IMAGEN_MODEL)

        result = client.models.generate_images(
            model=IMAGEN_MODEL,
            prompt=prompt,
            config=dict(
                number_of_images=1,
                aspect_ratio="1:1",
                output_mime_type="image/png",
            ),
        )

        if result and getattr(result, "generated_images", None):
            for gen_img in result.generated_images:
                img_data = gen_img.image.image_bytes
                image = Image.open(io.BytesIO(img_data))
                output_path.parent.mkdir(parents=True, exist_ok=True)
                image.save(str(output_path), "PNG")
                logger.info("Gemini Imagen image generated and saved to %s", output_path)
                return True

        return False

    except Exception as exc:
        logger.info("Imagen generation note: %s. Using styled panel graphic.", exc)
        return False


def generate_image(
    prompt: str,
    filename: Optional[str] = None,
    comic_id: Optional[str] = None,
    style: str = "",
    seed: Optional[int] = None,
    gemini_api_key: Optional[str] = None,
    **kwargs,
) -> str:
    """Generates one comic illustration panel and saves it to static/panels/<comic_id>/...

    Uses the single unified Google Gemini API key to generate images via Imagen,
    falling back to rich Pillow comic illustrations if Imagen quota is unavailable.

    Args:
        prompt: Descriptive visual prompt for this panel.
        filename: Optional explicit file name (e.g. 'panel_1.png').
        comic_id: Unique identifier for the comic series folder.
        style: Art style string ('anime', 'comic book', 'pixel art', 'realistic').
        seed: Random integer seed.
        gemini_api_key: The unified Google Gemini API key.

    Returns:
        The relative web-accessible path to the saved panel: 'static/panels/...'.
    """
    effective_id = comic_id or str(uuid.uuid4())[:8]
    effective_filename = filename or f"panel_{uuid.uuid4().hex[:6]}.png"
    if not effective_filename.endswith(".png"):
        effective_filename += ".png"

    folder_path = PANELS_DIR / effective_id
    folder_path.mkdir(parents=True, exist_ok=True)
    full_output_path = folder_path / effective_filename

    # Build the enhanced prompt with the style map suffix
    style_key = style.strip().lower()
    suffix = STYLE_MAP.get(style_key, "")
    enhanced_prompt = f"{prompt}, {suffix}" if suffix else prompt

    active_key = resolve_gemini_key(gemini_api_key)

    success = False
    if active_key:
        success = _generate_gemini_imagen(enhanced_prompt, full_output_path, api_key=active_key)

    if not success:
        _draw_placeholder_panel(
            prompt,
            full_output_path,
            style=style,
            panel_title=filename or "",
        )

    # Return web-safe forward slash relative path
    rel_path = f"static/panels/{effective_id}/{effective_filename}"
    return rel_path
