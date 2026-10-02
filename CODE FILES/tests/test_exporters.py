"""Tests for the PDF Exporter Module (app/exporters.py).

Verifies that save_pdf handles Unicode characters safely and generates
a complete 6-page PDF document (1 cover page + 5 panel pages).
"""

from pathlib import Path
from app.config import BASE_DIR, EXPORTS_DIR
from app.exporters import save_pdf


def test_save_pdf_produces_six_pages_with_unicode():
    """Generates a PDF using 5 dummy panels and Unicode characters, verifying 6 pages total."""
    unicode_prompt = "A brave fox exploring “Enchanted Woods” — with curly quotes, em-dashes, and special accents: café & naïve."

    # Build 5 dummy panels
    dummy_layout = []
    for i in range(1, 6):
        dummy_layout.append({
            "panel": i,
            "title": f"Panel {i}: The Wonder of Discovery",
            "image_path": "static/panels/placeholder_test.png",
            "scene_description": f"Scene description {i} with curly quotes “hello” and dashes —.",
            "image_prompt": f"Visual prompt {i}",
            "caption": f"*SOUND EFFECT {i}!*",
            "narration": f"Narration for panel {i} with em—dash and symbols: ‘star’.",
            "dialogue": [{"speaker": "Rusty", "line": "We did it! ‘Fantastic’"}],
            "text": "Full text summary",
            "is_placeholder": True,
        })

    meta = {
        "prompt": unicode_prompt,
        "character_name": "Rusty the Fox",
        "setting": "Forest",
        "tone": "Light-hearted",
        "style": "Comic Book",
    }

    pdf_rel_path = save_pdf(dummy_layout, meta=meta)
    assert pdf_rel_path.startswith("static/exports/")
    assert pdf_rel_path.endswith(".pdf")

    full_pdf_path = BASE_DIR / pdf_rel_path
    assert full_pdf_path.exists()
    assert full_pdf_path.stat().st_size > 1000  # Valid non-empty PDF file

    # Verify 6 pages (Cover page + 5 panel pages)
    try:
        from pypdf import PdfReader
        reader = PdfReader(str(full_pdf_path))
        assert len(reader.pages) == 6
    except ImportError:
        # Fallback binary page count heuristic for FPDF
        content = full_pdf_path.read_bytes()
        page_markers = content.count(b"/Type /Page\n") + content.count(b"/Type /Page ")
        assert page_markers >= 6
