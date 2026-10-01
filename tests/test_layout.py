"""Tests for the Comic Layout Builder Module (app/layout_builder.py).

Tests parsing of well-formed story output, handling missing panels,
and odd formatting tolerance as required by Milestone 5.
"""

from app.layout_builder import build_comic_layout, parse_story_text


def test_parse_well_formed_story():
    """Verifies that standard **Panel N: <Title>** format parses captions, narration, and dialogues."""
    story = (
        "**Panel 1: The Adventure Begins**\n"
        "Caption: *RUSTLE!*\n"
        "Narration: Rusty stepped bravely into the whispering trees.\n"
        "Dialogue:\n"
        "- Rusty: \"Here goes nothing!\"\n\n"
        "**Panel 2: A Strange Glow**\n"
        "Caption: *SHIMMER!*\n"
        "Narration: A golden radiance caught Rusty's eye ahead.\n"
        "Dialogue:\n"
        "- Rusty: \"What could that be?\"\n"
    )

    parsed = parse_story_text(story)
    assert 1 in parsed
    assert 2 in parsed

    p1 = parsed[1]
    assert p1["title"] == "The Adventure Begins"
    assert "*RUSTLE!*" in p1["caption"]
    assert "whispering trees" in p1["narration"]
    assert len(p1["dialogue"]) == 1
    assert p1["dialogue"][0]["speaker"] == "Rusty"
    assert p1["dialogue"][0]["line"] == "Here goes nothing!"


def test_layout_with_missing_panel_text():
    """Verifies that missing panel text gracefully falls back to that panel's scene_description."""
    outline = [
        {
            "panel": 1,
            "title": "Setup",
            "scene_description": "Rusty enters the forest scene.",
            "image_prompt": "Prompt 1",
        },
        {
            "panel": 2,
            "title": "Mystery",
            "scene_description": "Rusty looks at the ancient tree.",
            "image_prompt": "Prompt 2",
        },
    ]

    # Only Panel 1 has story text, Panel 2 is missing from model output
    partial_story = (
        "**Panel 1: Setup**\n"
        "Caption: *STEP*\n"
        "Narration: Walking in the woods.\n"
    )

    image_paths = ["static/panels/test/p1.png", "static/panels/test/p2.png"]
    layout = build_comic_layout(image_paths, partial_story, outline)

    assert len(layout) == 2
    p1 = layout[0]
    p2 = layout[1]

    assert p1["panel"] == 1
    assert p1["caption"] == "*STEP*"

    assert p2["panel"] == 2
    # Panel 2 must fall back to its scene_description so it is never blank
    assert p2["narration"] == "Rusty looks at the ancient tree."


def test_layout_odd_formatting_tolerance():
    """Verifies that irregular capitalization, spacing, or punctuation does not crash parsing."""
    odd_story = (
        "**Panel  1 :   Odd Spaces in Title   **\n\n"
        "Caption :   *SPLAT!*  \n"
        "Narration: Something weird happened here.\n"
        "Dialogue: \n"
        " -   Rusty  :  \"Check this out!\" \n"
    )

    parsed = parse_story_text(odd_story)
    assert 1 in parsed
    assert parsed[1]["title"] == "Odd Spaces in Title"
    assert parsed[1]["caption"] == "*SPLAT!*"
    assert len(parsed[1]["dialogue"]) == 1
    assert parsed[1]["dialogue"][0]["speaker"] == "Rusty"
    assert parsed[1]["dialogue"][0]["line"] == "Check this out!"
