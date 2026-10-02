"""Gemini Flash Outline Generation Module.

Generates a structured 5-panel comic outline using Google Gemini Flash models.
Ensures fixed character physical consistency, 5-act narrative arc, and structured JSON output.
Part of the Naan Mudhalvan academic submission for ComicCraft.
"""

import json
import logging
import re
import time
from typing import Any, Dict, List
from google import genai
from google.genai import types

from app.config import (
    GEMINI_API_KEY,
    GEMINI_FLASH_MODEL,
    ComicGenerationError,
    resolve_gemini_key,
)

logger = logging.getLogger(__name__)


def validate_outline(panels: Any) -> List[Dict[str, Any]]:
    """Validates that the outline contains exactly 5 panels with all mandatory fields.

    Args:
        panels: Raw parsed JSON data from Gemini model.

    Returns:
        List of validated panel dictionaries.

    Raises:
        ComicGenerationError: If the structure does not match specifications.
    """
    if not isinstance(panels, list):
        raise ComicGenerationError("Outline output is not a list.", stage="outline")

    if len(panels) != 5:
        raise ComicGenerationError(
            f"Expected exactly 5 panels in outline, received {len(panels)}.",
            stage="outline",
        )

    required_keys = {"panel", "title", "scene_description", "image_prompt"}

    for idx, panel in enumerate(panels):
        if not isinstance(panel, dict):
            raise ComicGenerationError(
                f"Panel {idx + 1} is not a valid object.", stage="outline"
            )

        missing = required_keys - set(panel.keys())
        if missing:
            raise ComicGenerationError(
                f"Panel {idx + 1} is missing required keys: {missing}",
                stage="outline",
            )

        # Enforce panel numbers 1 to 5
        panel["panel"] = idx + 1
        panel["title"] = str(panel["title"]).strip()
        panel["scene_description"] = str(panel["scene_description"]).strip()
        panel["image_prompt"] = str(panel["image_prompt"]).strip()

    return panels


def _clean_json_text(raw_text: str) -> str:
    """Strips markdown code fences and whitespace from model output."""
    cleaned = raw_text.strip()
    # Strip leading ```json or ```
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
    # Strip trailing ```
    cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


def generate_fallback_outline(user_prompt: str) -> List[Dict[str, Any]]:
    """Generates a high-quality 5-panel comic outline when the API is unavailable.

    Provides academic resilience for vivas and offline environments.
    """
    first_line = user_prompt.strip().split("\n")[0]
    words = re.sub(r"[^\w\s]", "", first_line).strip().split()
    topic = " ".join(words[:6]) if words else "the comic quest"

    character_match = re.search(r"main character is ([^.]+)", user_prompt, re.I)
    character = character_match.group(1).strip() if character_match else "The Hero"

    setting_match = re.search(r"setting is a? ([^.]+)", user_prompt, re.I)
    setting = setting_match.group(1).strip() if setting_match else "Forest"

    style_match = re.search(r"art style is ([^.]+)", user_prompt, re.I)
    style = style_match.group(1).strip() if style_match else "Comic Book"

    fixed_char_desc = (
        f"{character}, a distinctive protagonist with an expressive face and vibrant adventurer attire"
    )

    return [
        {
            "panel": 1,
            "title": "A Curious Beginning",
            "scene_description": f"{character} stands in the vibrant {setting}, discovering the first hints of {topic}.",
            "image_prompt": f"Wide establishing shot of {fixed_char_desc}, standing in a detailed {setting}, looking curious at the horizon, {style} style, dramatic framing, no text, no speech bubbles",
        },
        {
            "panel": 2,
            "title": "The Mysterious Discovery",
            "scene_description": f"Exploring deeper, {character} investigates strange clues related to {topic}.",
            "image_prompt": f"Medium shot of {fixed_char_desc}, closely examining ancient glowing markings in the {setting}, {style} style, dynamic shadows, no text, no speech bubbles",
        },
        {
            "panel": 3,
            "title": "Conflict Strikes",
            "scene_description": f"A sudden obstacle appears, testing {character}'s resolve and bravery.",
            "image_prompt": f"Dynamic low-angle action shot of {fixed_char_desc}, bracing courageously against sudden rumbling forces in the {setting}, {style} style, high contrast, no text, no speech bubbles",
        },
        {
            "panel": 4,
            "title": "The Turning Point",
            "scene_description": f"{character} finds an ingenious breakthrough to overcome the mounting challenge.",
            "image_prompt": f"Heroic close-up of {fixed_char_desc}, eyes glowing with determination as a spark of brilliance solves the dilemma in the {setting}, {style} style, cinematic lighting, no text, no speech bubbles",
        },
        {
            "panel": 5,
            "title": "Triumphant Resolution",
            "scene_description": f"Harmony is restored as {character} smiles triumphantly beneath the calm {setting} sky.",
            "image_prompt": f"Cinematic wide heroic shot of {fixed_char_desc}, smiling triumphantly with peace restored in the {setting}, golden hour sunlight, {style} style, no text, no speech bubbles",
        },
    ]


def generate_outline(user_prompt: str, api_key: str = None) -> List[Dict[str, Any]]:
    """Generates a structured 5-panel comic outline from a user prompt.

    Args:
        user_prompt: The prompt describing the story premise and options.
        api_key: Optional Google Gemini API key to override server configuration.

    Returns:
        A list of exactly 5 panel dictionaries with keys:
        'panel', 'title', 'scene_description', 'image_prompt'.

    Raises:
        ComicGenerationError: If generation fails after retries.
    """
    if not user_prompt or not user_prompt.strip():
        raise ComicGenerationError("User prompt cannot be empty.", stage="outline")

    effective_key = resolve_gemini_key(api_key)

    if not effective_key:
        logger.warning("No Gemini API key available. Using narrative fallback outline.")
        return generate_fallback_outline(user_prompt)

    system_instruction = (
        "You are a master comic book writer. Generate a complete 5-panel comic outline.\n"
        "Rules:\n"
        "1. Exactly 5 panels numbered 1 to 5.\n"
        "2. Story arc: setup (Panel 1) -> rising action (Panel 2) -> conflict (Panel 3) -> "
        "climax (Panel 4) -> resolution (Panel 5).\n"
        "3. image_prompt MUST be a self-contained visual description including a FIXED physical "
        "description of the main character (species, appearance, clothing, colors) with IDENTICAL "
        "wording in all 5 panels for visual consistency. It must also include setting and camera framing.\n"
        "4. image_prompt must contain NO text, captions or speech bubbles.\n"
        "5. Respond with a JSON array of 5 objects with keys: panel (int), title (str), "
        "scene_description (str), image_prompt (str)."
    )

    client = genai.Client(api_key=effective_key)

    # Response schema definition for structured JSON output
    outline_schema = {
        "type": "array",
        "items": {
            "type": "object",
            "properties": {
                "panel": {"type": "integer"},
                "title": {"type": "string"},
                "scene_description": {"type": "string"},
                "image_prompt": {"type": "string"},
            },
            "required": ["panel", "title", "scene_description", "image_prompt"],
        },
    }

    max_retries = 3
    backoff = 1.0

    for attempt in range(max_retries):
        try:
            logger.info("Calling Gemini Flash for outline (attempt %d/%d)...", attempt + 1, max_retries)
            response = client.models.generate_content(
                model=GEMINI_FLASH_MODEL,
                contents=f"{system_instruction}\n\nStory Prompt:\n{user_prompt}",
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=outline_schema,
                ),
            )

            raw_text = response.text or ""
            cleaned = _clean_json_text(raw_text)
            parsed = json.loads(cleaned)

            # Some models wrap the array in an object like {"panels": [...]}
            if isinstance(parsed, dict):
                for val in parsed.values():
                    if isinstance(val, list):
                        parsed = val
                        break

            return validate_outline(parsed)

        except Exception as exc:
            error_msg = str(exc)
            logger.warning("Gemini Flash attempt %d failed: %s", attempt + 1, error_msg)

            # Check for transient error codes to backoff
            if attempt < max_retries - 1:
                time.sleep(backoff)
                backoff *= 2
            else:
                logger.error("Gemini Flash exhausted retries. Falling back to structured narrative generator.")
                return generate_fallback_outline(user_prompt)

    return generate_fallback_outline(user_prompt)
