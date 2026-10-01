"""PDF Export Module using fpdf2.

Generates multi-page comic book PDFs with a styled cover page,
individual panel pages with proportional artwork, dialogue callouts,
Unicode glyph safety, and page numbering footers.
Part of the Naan Mudhalvan academic submission for ComicCraft.
"""

import datetime
import logging
import os
import unicodedata
from pathlib import Path
from typing import Any, Dict, List, Optional

from fpdf import FPDF

from app.config import (
    BASE_DIR,
    EXPORTS_DIR,
    FONTS_DIR,
)

logger = logging.getLogger(__name__)


def sanitize_text_for_helvetica(text: str) -> str:
    """Sanitizes unicode text to latin-1 safe representation for fallback core fonts."""
    # Replace curly quotes and dashes with ASCII equivalents
    replacements = {
        "\u2018": "'",
        "\u2019": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\u2014": "--",
        "\u2013": "-",
        "\u2026": "...",
        "\u2022": "*",
    }
    for orig, rep in replacements.items():
        text = text.replace(orig, rep)

    # Normalize and encode/decode to latin-1
    normalized = unicodedata.normalize("NFKD", text)
    encoded = normalized.encode("latin-1", "ignore").decode("latin-1")
    return encoded


class ComicPDF(FPDF):
    """Custom FPDF subclass with page-number footer and font registration."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.has_dejavu = False
        self._register_fonts()

    def _register_fonts(self):
        """Registers DejaVuSans Unicode fonts if present on disk."""
        regular_font = FONTS_DIR / "DejaVuSans.ttf"
        bold_font = FONTS_DIR / "DejaVuSans-Bold.ttf"

        if regular_font.exists() and bold_font.exists():
            try:
                self.add_font("DejaVu", "", str(regular_font))
                self.add_font("DejaVu", "B", str(bold_font))
                self.has_dejavu = True
                logger.info("DejaVu fonts registered successfully.")
            except Exception as exc:
                logger.warning("Could not register DejaVu fonts: %s", exc)
                self.has_dejavu = False
        else:
            self.has_dejavu = False

    def safe_text(self, text: str) -> str:
        """Returns unicode text directly if DejaVu is active, otherwise latin-1 sanitized text."""
        if not self.has_dejavu:
            return sanitize_text_for_helvetica(text)
        return text

    def get_font_family(self) -> str:
        """Returns the active font family name."""
        return "DejaVu" if self.has_dejavu else "Helvetica"

    def footer(self):
        """Renders page number footer on all pages."""
        self.set_y(-15)
        self.set_font(self.get_font_family(), "", 9)
        self.set_text_color(140, 140, 140)
        footer_text = f"ComicCraft AI Studio  |  Page {self.page_no()}"
        self.cell(0, 10, self.safe_text(footer_text), align="C")


def save_pdf(layout: List[Dict[str, Any]], meta: Optional[Dict[str, Any]] = None) -> str:
    """Generates a multi-page PDF from comic layout and metadata.

    Args:
        layout: List of 5 panel layout dictionaries.
        meta: Optional metadata dict (prompt, character_name, setting, tone, style).

    Returns:
        The relative web-accessible path to the generated PDF: 'static/exports/...'.
    """
    meta = meta or {}
    pdf = ComicPDF(orientation="P", unit="mm", format="A4")
    font_fam = pdf.get_font_family()

    # -------------------------------------------------------------------------
    # COVER PAGE
    # -------------------------------------------------------------------------
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)

    # Top border bar
    pdf.set_fill_color(234, 179, 8)  # Amber Yellow
    pdf.rect(0, 0, 210, 12, style="F")

    pdf.set_y(35)
    pdf.set_font(font_fam, "B", 32)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(pdf.epw, 14, pdf.safe_text("COMICCRAFT"), align="C", new_x="LMARGIN", new_y="NEXT")

    pdf.set_font(font_fam, "B", 14)
    pdf.set_text_color(100, 116, 139)
    pdf.cell(pdf.epw, 8, pdf.safe_text("AI 5-Panel Comic Story Strip"), align="C", new_x="LMARGIN", new_y="NEXT")

    pdf.ln(10)

    # Story Premise Card
    pdf.set_fill_color(248, 250, 252)
    pdf.set_draw_color(203, 213, 225)
    card_x = 25
    card_w = 160
    pdf.set_x(card_x)

    prompt_text = meta.get("prompt", "An exciting comic story adventure.")
    pdf.set_font(font_fam, "", 12)
    pdf.set_text_color(30, 41, 59)
    pdf.multi_cell(
        card_w,
        8,
        pdf.safe_text(f'"{prompt_text}"'),
        border=1,
        fill=True,
        align="C",
        new_x="LMARGIN",
        new_y="NEXT",
    )

    pdf.ln(10)

    # Metadata Grid
    pdf.set_font(font_fam, "B", 11)
    details = [
        ("Protagonist", meta.get("character_name", "Hero")),
        ("Setting", meta.get("setting", "Forest")),
        ("Story Tone", meta.get("tone", "Light-hearted")),
        ("Art Style", meta.get("style", "Comic Book")),
        ("Creation Date", datetime.datetime.now().strftime("%B %d, %Y - %H:%M")),
    ]

    for label, val in details:
        pdf.set_x(35)
        pdf.set_text_color(71, 85, 105)
        pdf.cell(50, 7, pdf.safe_text(f"{label}:"), border=0)
        pdf.set_text_color(15, 23, 42)
        pdf.cell(90, 7, pdf.safe_text(str(val)), border=0, new_x="LMARGIN", new_y="NEXT")

    # -------------------------------------------------------------------------
    # PANEL PAGES (1 page per panel)
    # -------------------------------------------------------------------------
    for panel_item in layout:
        pdf.add_page()
        p_num = panel_item.get("panel", 1)
        p_title = panel_item.get("title", f"Panel {p_num}")
        p_img = panel_item.get("image_path", "")
        p_scene = panel_item.get("scene_description", "")
        p_cap = panel_item.get("caption", "")
        p_nar = panel_item.get("narration", "")
        p_dia = panel_item.get("dialogue", [])

        # Heading: "Panel N: Title"
        pdf.set_font(font_fam, "B", 18)
        pdf.set_text_color(15, 23, 42)
        pdf.cell(
            pdf.epw,
            10,
            pdf.safe_text(f"Panel {p_num}: {p_title}"),
            align="L",
            new_x="LMARGIN",
            new_y="NEXT",
        )
        pdf.ln(2)

        # Image Placement
        img_resolved = None
        if p_img:
            # Check relative and absolute paths
            cand1 = BASE_DIR / p_img
            cand2 = Path(p_img)
            if cand1.exists():
                img_resolved = str(cand1)
            elif cand2.exists():
                img_resolved = str(cand2)

        if img_resolved and os.path.exists(img_resolved):
            try:
                # Scale width to page width keeping aspect ratio (square 512x512)
                img_display_w = min(pdf.epw, 130)
                img_x = (210 - img_display_w) / 2
                pdf.image(img_resolved, x=img_x, y=pdf.get_y(), w=img_display_w)
                pdf.set_y(pdf.get_y() + img_display_w + 5)
            except Exception as img_exc:
                logger.warning("Failed to render image in PDF: %s", img_exc)
                pdf.set_text_color(220, 38, 38)
                pdf.cell(pdf.epw, 8, "Image missing", align="C", new_x="LMARGIN", new_y="NEXT")
        else:
            pdf.set_text_color(156, 163, 175)
            pdf.cell(pdf.epw, 8, "Image missing", align="C", new_x="LMARGIN", new_y="NEXT")

        # Scene description (in grey)
        if p_scene:
            pdf.set_font(font_fam, "", 10)
            pdf.set_text_color(100, 116, 139)
            pdf.multi_cell(
                pdf.epw,
                5,
                pdf.safe_text(f"Scene: {p_scene}"),
                align="L",
                new_x="LMARGIN",
                new_y="NEXT",
            )
            pdf.ln(2)

        # Caption (Comic caption banner)
        if p_cap:
            pdf.set_fill_color(254, 240, 138)  # Light yellow caption box
            pdf.set_font(font_fam, "B", 10)
            pdf.set_text_color(15, 23, 42)
            pdf.multi_cell(
                pdf.epw,
                6,
                pdf.safe_text(f"  {p_cap}  "),
                border=1,
                fill=True,
                align="L",
                new_x="LMARGIN",
                new_y="NEXT",
            )
            pdf.ln(2)

        # Narration
        if p_nar:
            pdf.set_font(font_fam, "", 10)
            pdf.set_text_color(30, 41, 59)
            pdf.multi_cell(
                pdf.epw,
                5,
                pdf.safe_text(p_nar),
                align="L",
                new_x="LMARGIN",
                new_y="NEXT",
            )
            pdf.ln(2)

        # Dialogue Lines
        if p_dia:
            pdf.set_font(font_fam, "B", 10)
            pdf.set_text_color(15, 23, 42)
            for dia in p_dia:
                spk = dia.get("speaker", "Character")
                speech = dia.get("line", "")
                pdf.multi_cell(
                    pdf.epw,
                    5,
                    pdf.safe_text(f"- {spk}: \"{speech}\""),
                    align="L",
                    new_x="LMARGIN",
                    new_y="NEXT",
                )

    # Generate timestamped filename: comic_YYYYmmdd_HHMMSS.pdf
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"comic_{timestamp}.pdf"
    output_pdf_path = EXPORTS_DIR / filename
    pdf.output(str(output_pdf_path))

    return f"static/exports/{filename}"
