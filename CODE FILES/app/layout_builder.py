"""Comic Layout Builder Module.

Parses formatted story text and assembles structured panel layout dictionaries
matching panel numbers with corresponding outline descriptions and illustration paths.
Part of the Naan Mudhalvan academic submission for ComicCraft.
"""

import logging
import re
from typing import Any, Dict, List

logger = logging.getLogger(__name__)


def parse_story_text(full_story: str) -> Dict[int, Dict[str, Any]]:
    """Parses story text using regex matching on '**Panel N:'.

    Extracts caption, narration, and dialogue items keyed by integer panel number.

    Args:
        full_story: Formatted string containing panel blocks.

    Returns:
        Dictionary mapping panel number (int) -> parsed content dictionary.
    """
    parsed_panels: Dict[int, Dict[str, Any]] = {}

    if not full_story or not full_story.strip():
        return parsed_panels

    # Split on panel markers: **Panel N: <Title>**
    pattern = r"\*\*Panel\s*(\d+)\s*:\s*(.*?)\*\*"
    matches = list(re.finditer(pattern, full_story, flags=re.IGNORECASE))

    for idx, match in enumerate(matches):
        panel_num = int(match.group(1))
        panel_title = match.group(2).strip()

        # Content runs from end of current match to start of next match or end of string
        start_pos = match.end()
        end_pos = matches[idx + 1].start() if idx + 1 < len(matches) else len(full_story)
        block = full_story[start_pos:end_pos].strip()

        caption = ""
        narration = ""
        dialogue: List[Dict[str, str]] = []

        # Extract Caption
        cap_match = re.search(r"Caption\s*:\s*(.*?)(?=\n\s*(?:Narration|Dialogue)|$)", block, flags=re.IGNORECASE | re.DOTALL)
        if cap_match:
            caption = cap_match.group(1).strip()

        # Extract Narration
        nar_match = re.search(r"Narration\s*:\s*(.*?)(?=\n\s*Dialogue|$)", block, flags=re.IGNORECASE | re.DOTALL)
        if nar_match:
            narration = nar_match.group(1).strip()

        # Extract Dialogue section
        dia_match = re.search(r"Dialogue\s*:\s*(.*)", block, flags=re.IGNORECASE | re.DOTALL)
        if dia_match:
            dia_block = dia_match.group(1).strip()
            # Look for lines starting with '- Speaker: "Quote"' or 'Speaker: "Quote"'
            for line in dia_block.splitlines():
                line = line.strip().lstrip("-").strip()
                if not line:
                    continue
                quote_match = re.search(r"^([^:]+):\s*[\"']?(.*?)[\"']?$", line)
                if quote_match:
                    speaker = quote_match.group(1).strip()
                    speech = quote_match.group(2).strip()
                    if speech:
                        dialogue.append({"speaker": speaker, "line": speech})

        parsed_panels[panel_num] = {
            "title": panel_title,
            "caption": caption,
            "narration": narration,
            "dialogue": dialogue,
            "raw_block": block,
        }

    return parsed_panels


def build_comic_layout(
    image_paths: List[str], full_story: str, outline: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """Assembles the final comic panel layout list.

    Maps by explicit PANEL NUMBER rather than zip order.
    Ensures that if any text is missing or unparseable, it safely falls back to scene_description.

    Args:
        image_paths: List of relative image paths (e.g. ['static/panels/...']).
        full_story: Full formatted story string.
        outline: The 5-panel outline list.

    Returns:
        List of structured panel layout dictionaries with keys:
        'panel', 'title', 'image_path', 'scene_description', 'image_prompt',
        'caption', 'narration', 'dialogue', 'text', 'is_placeholder'.
    """
    story_map = parse_story_text(full_story)
    layout: List[Dict[str, Any]] = []

    for idx, out_item in enumerate(outline):
        panel_num = int(out_item.get("panel", idx + 1))
        title = out_item.get("title", f"Panel {panel_num}")
        scene_desc = out_item.get("scene_description", "")
        img_prompt = out_item.get("image_prompt", "")

        # Find corresponding image path
        img_path = ""
        if idx < len(image_paths):
            img_path = image_paths[idx]
        elif image_paths:
            img_path = image_paths[-1]

        # Retrieve parsed story block
        story_data = story_map.get(panel_num, {})

        # Fallback fields if model text was missing or unparseable
        effective_title = story_data.get("title") or title
        effective_caption = story_data.get("caption") or f"*SCENE {panel_num}*"
        effective_narration = story_data.get("narration") or scene_desc
        effective_dialogue = story_data.get("dialogue") or []

        # Full cleaned panel text summary
        dialogue_text = "\n".join(
            f"{d.get('speaker', 'Hero')}: \"{d.get('line', '')}\""
            for d in effective_dialogue
        )
        full_text_parts = [
            f"Caption: {effective_caption}",
            f"Narration: {effective_narration}",
        ]
        if dialogue_text:
            full_text_parts.append(f"Dialogue:\n{dialogue_text}")

        full_panel_text = "\n\n".join(full_text_parts)

        # Detect placeholder status
        is_placeholder = (
            "placeholder" in img_path.lower()
            or not img_path
            or "_placeholder" in img_path.lower()
        )

        layout.append({
            "panel": panel_num,
            "title": effective_title,
            "image_path": img_path,
            "scene_description": scene_desc,
            "image_prompt": img_prompt,
            "caption": effective_caption,
            "narration": effective_narration,
            "dialogue": effective_dialogue,
            "text": full_panel_text,
            "is_placeholder": is_placeholder,
        })

    return layout
