"""Gemini Pro Story Generation Module.

Expands a 5-panel comic outline into dialogue, narration, and captions using
Google Gemini Pro models, with runtime fallback to Gemini Flash.
Formats the story into standard markdown panel headings for layout parsing.
Part of the Naan Mudhalvan academic submission for ComicCraft.
"""

import logging
import time
from typing import Any, Dict, List
from google import genai

from app.config import (
    GEMINI_API_KEY,
    GEMINI_PRO_MODEL,
    GEMINI_FLASH_MODEL,
    ComicGenerationError,
    resolve_gemini_key,
)

logger = logging.getLogger(__name__)

# Tracks which model was successfully used at runtime for display on the preview page footer
LAST_USED_STORY_MODEL = GEMINI_PRO_MODEL


def format_outline_for_prompt(outline: List[Dict[str, Any]]) -> str:
    """Formats the outline into human-readable text instead of raw Python dict repr."""
    lines = []
    for item in outline:
        num = item.get("panel", 1)
        title = item.get("title", f"Panel {num}")
        scene = item.get("scene_description", "")
        lines.append(f"Panel {num}: {title}\nScene: {scene}")
    return "\n\n".join(lines)


def generate_fallback_story(
    outline: List[Dict[str, Any]], character_name: str = "", tone: str = ""
) -> str:
    """Generates tone-accurate formatted comic story text if API calls fail or run offline.

    Ensures viva demonstrations never stall.
    """
    hero = character_name.strip() if character_name else "The Hero"
    tone_clean = tone.strip().lower()

    # Pre-crafted tone-specific dialogue and narration scripts
    tone_scripts = {
        "funny": [
            ("CLATTER!", f"{hero} stumbled into the scene, knocking over three completely innocent bushes. Classic entrance.", f"- {hero}: \"Note to self: Never go adventuring on an empty stomach!\""),
            ("SQUEAK?!", f"{hero} stared at the glowing oddity. It wasn't supposed to be making rubber duck noises.", f"- {hero}: \"Wait, is that supposed to be ticking or quacking?!\""),
            ("KABOOM-ISH!", f"Everything that could go wrong did, with spectacular comedic timing. Smoke filled the air.", f"- {hero}: \"Totally planned! Everything is under complete control!\""),
            ("WHOOSH!", f"Through sheer dumb luck and quick reflexes, {hero} triggered the right switch.", f"- {hero}: \"I meant to do that! Naturally!\""),
            ("TA-DA!", f"Covered in glitter and twigs, {hero} struck a victorious pose as bystanders cheered.", f"- {hero}: \"And that's how a true professional gets the job done!\""),
        ],
        "dramatic": [
            ("THUNDER RUMBLES", f"The wind bit fiercely as {hero} surveyed the treacherous terrain ahead. Time was slipping away.", f"- {hero}: \"We cannot afford to falter now. The stakes are too high.\""),
            ("A STRANGE HUM", f"Deep within the shadows, an ancient power pulsed. {hero}'s grip tightened with resolve.", f"- {hero}: \"Something is shifting... the rift is awakening.\""),
            ("CRACK OF POWER!", f"The tempest reached its zenith. {hero} stood against the overwhelming onslaught with unyielding courage.", f"- {hero}: \"I will not break! Not today!\""),
            ("FLASH OF LIGHT", f"Channeling every ounce of strength, {hero} shattered the core of the confrontation.", f"- {hero}: \"It ends here and now!\""),
            ("PEACE AT LAST", f"Silence reclaimed the land. {hero} took a slow breath, scars bearing witness to victory.", f"- {hero}: \"It is done. The realm is safe once more.\""),
        ],
        "poetic": [
            ("WHISPER OF LEAVES", f"Beneath the emerald canopy, {hero} paused, listening to melodies carried by the morning breeze.", f"- {hero}: \"Every step is a verse written upon the earth.\""),
            ("LUMINESCENCE", f"A soft radiance bloomed across the horizon, painting dreams into the waking world.", f"- {hero}: \"Behold the quiet embers of forgotten stars.\""),
            ("A GATHERING STORM", f"Shadow and light danced in an ethereal duel. {hero} reached forward, seeking harmony amid chaos.", f"- {hero}: \"Even the deepest night must bow to the dawn.\""),
            ("RIPPLES OF HOPE", f"A single spark of understanding unraveled centuries of sorrow. The world began to breathe again.", f"- {hero}: \"In stillness, we find our truest strength.\""),
            ("GOLDEN TWILIGHT", f"The journey drew to a close under a tapestry of starlight. {hero} smiled into the dusk.", f"- {hero}: \"And so the tale becomes a memory to guide tomorrow.\""),
        ],
        "light-hearted": [
            ("CHIRP!", f"The sun was shining bright as {hero} set forth with a bounce in their step.", f"- {hero}: \"What a marvelous day for an adventure!\""),
            ("SPARKLE!", f"{hero} peeked around the corner and discovered a glowing secret waiting to be explored.", f"- {hero}: \"Aha! Curiosity pays off again!\""),
            ("WHOOPS!", f"A little twist in the path led to unexpected excitement. {hero} took it in stride with a laugh.", f"- {hero}: \"Hold on to your hats, everyone!\""),
            ("PRESTO!", f"With cheerful ingenuity, {hero} solved the puzzle and opened the hidden doorway.", f"- {hero}: \"Easy as pie when you work together!\""),
            ("CHEERS!", f"Friends gathered round as {hero} celebrated the wonderful conclusion of today's quest.", f"- {hero}: \"Who's ready for the next adventure?\""),
        ],
    }

    selected = tone_scripts.get(tone_clean, tone_scripts["light-hearted"])

    output_panels = []
    for idx, item in enumerate(outline[:5]):
        panel_num = item.get("panel", idx + 1)
        title = item.get("title", f"Panel {panel_num}")
        caption, narration, dialogue = selected[idx % len(selected)]

        block = (
            f"**Panel {panel_num}: {title}**\n"
            f"Caption: {caption}\n"
            f"Narration: {narration}\n"
            f"Dialogue:\n"
            f"{dialogue}"
        )
        output_panels.append(block)

    return "\n\n".join(output_panels)


def generate_story(
    outline: List[Dict[str, Any]],
    character_name: str = "",
    tone: str = "",
    api_key: str = None,
) -> str:
    """Generates the full comic narrative, captions, and dialogues for the outline.

    Calls Gemini Pro with automatic fallback to Gemini Flash.

    Args:
        outline: The 5-panel outline list.
        character_name: Main protagonist name.
        tone: Tone of the comic story.
        api_key: Optional Google Gemini API key to override server configuration.

    Returns:
        Formatted multi-panel string following the '**Panel N: <Title>**' schema.

    Raises:
        ComicGenerationError: If the story generation fails completely.
    """
    global LAST_USED_STORY_MODEL

    if not outline:
        raise ComicGenerationError("Outline cannot be empty for story generation.", stage="story")

    effective_key = resolve_gemini_key(api_key)

    if not effective_key:
        logger.warning("No Gemini API key available. Using tone-accurate fallback story.")
        LAST_USED_STORY_MODEL = "narrative-engine"
        return generate_fallback_story(outline, character_name, tone)

    client = genai.Client(api_key=effective_key)
    formatted_outline = format_outline_for_prompt(outline)

    system_instruction = (
        "You are an award-winning comic book writer. Given a 5-panel comic outline, write the "
        "dialogue, narration, and sound effect caption for each panel.\n\n"
        f"Main Character: {character_name or 'The Hero'}\n"
        f"Story Tone: {tone or 'Light-hearted'}\n\n"
        "Requirements:\n"
        "1. The Tone MUST strongly shape the writing style:\n"
        "   - Funny: jokes, witty remarks, puns, slapstick humor.\n"
        "   - Dramatic: high stakes, suspense, intense speech.\n"
        "   - Poetic: lyrical cadence, evocative metaphors, atmospheric phrasing.\n"
        "   - Light-hearted: warm, cheerful, friendly banter.\n"
        "2. Output MUST strictly follow this exact plain-text format for each of the 5 panels:\n\n"
        "**Panel N: <Title>**\n"
        "Caption: <1 short ambient line or sound effect>\n"
        "Narration: <2–3 sentences of narrative prose>\n"
        "Dialogue:\n"
        "- <Speaker>: \"<line>\"\n\n"
        "Do NOT return markdown code blocks, JSON, or explanations. Only the formatted panel blocks."
    )

    models_to_try = [GEMINI_PRO_MODEL, GEMINI_FLASH_MODEL]

    for model_name in models_to_try:
        try:
            logger.info("Attempting story generation with model: %s", model_name)
            response = client.models.generate_content(
                model=model_name,
                contents=f"{system_instruction}\n\nOutline:\n{formatted_outline}",
            )

            text = response.text or ""
            if "**Panel" in text:
                LAST_USED_STORY_MODEL = model_name
                logger.info("Story generated successfully using %s", model_name)
                return text.strip()

        except Exception as exc:
            logger.warning("Model %s failed: %s", model_name, str(exc))

    logger.warning("All Gemini story models failed or throttled. Falling back to narrative script generator.")
    LAST_USED_STORY_MODEL = f"{GEMINI_FLASH_MODEL} (fallback)"
    return generate_fallback_story(outline, character_name, tone)
