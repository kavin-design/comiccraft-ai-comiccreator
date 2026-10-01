"""ComicCraft Configuration and Constants Module.

This module centralizes application settings, environment variable loading,
directory paths, allowed UI options, comic art style prompts, and custom exceptions.
Designed for the Naan Mudhalvan academic submission.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory paths
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env file at project root
load_dotenv(dotenv_path=BASE_DIR / ".env")

# Directory paths for templates, static assets, and generated outputs
TEMPLATES_DIR = BASE_DIR / "templates"
STATIC_DIR = BASE_DIR / "static"
PANELS_DIR = STATIC_DIR / "panels"
EXPORTS_DIR = STATIC_DIR / "exports"
FONTS_DIR = STATIC_DIR / "fonts"
IMAGES_DIR = STATIC_DIR / "images"

# Ensure all critical runtime output directories exist
for directory in [PANELS_DIR, EXPORTS_DIR, FONTS_DIR, IMAGES_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# API Key from environment
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()

# Model names (Google Gemini generative AI suite)
GEMINI_FLASH_MODEL = os.getenv("GEMINI_FLASH_MODEL", "gemini-2.5-flash").strip()
GEMINI_PRO_MODEL = os.getenv("GEMINI_PRO_MODEL", "gemini-2.5-pro").strip()
IMAGEN_MODEL = os.getenv("IMAGEN_MODEL", "imagen-3.0-generate-002").strip()

# Port configuration (default to 3000 for standard web environments)
PORT = int(os.getenv("PORT", "3000"))

# Allowed option values as per project specification
ALLOWED_SETTINGS = ["School", "Forest", "Space", "City"]
ALLOWED_TONES = ["Light-hearted", "Dramatic", "Poetic", "Funny"]
ALLOWED_STYLES = ["Anime", "Pixel Art", "Comic Book", "Realistic"]

# Mandatory comic art style prompt suffix map
STYLE_MAP = {
    "anime": "anime style, cel shading, vibrant colors, studio quality illustration",
    "comic book": "classic comic book art, bold ink outlines, halftone shading, flat vibrant colors",
    "pixel art": "pixel art, 16-bit retro game style, crisp pixels",
    "realistic": "photorealistic, cinematic lighting, highly detailed",
}

# Standard negative prompt for image generation
NEGATIVE_PROMPT = (
    "text, words, watermark, signature, speech bubble, blurry, deformed, extra limbs, low quality"
)


class ComicGenerationError(Exception):
    """Custom exception raised when comic generation fails at outline, story, image, or PDF stages."""

    def __init__(self, message: str, stage: str = "general"):
        super().__init__(message)
        self.message = message
        self.stage = stage

    def __str__(self) -> str:
        return f"[{self.stage.upper()}] {self.message}"


def update_env_api_key(gemini_key: str = None) -> None:
    """Updates runtime Gemini API key in memory and writes it into the .env file.

    Allows user-submitted keys to persist across sessions without restarting the container.
    """
    global GEMINI_API_KEY

    if gemini_key is not None and gemini_key.strip():
        cleaned_gemini = gemini_key.strip()
        GEMINI_API_KEY = cleaned_gemini
        os.environ["GEMINI_API_KEY"] = cleaned_gemini

        env_path = BASE_DIR / ".env"
        existing_lines = []
        if env_path.exists():
            existing_lines = env_path.read_text(encoding="utf-8").splitlines()

        new_lines = []
        seen = False
        for line in existing_lines:
            line_clean = line.strip()
            if line_clean.startswith("GEMINI_API_KEY="):
                new_lines.append(f"GEMINI_API_KEY={cleaned_gemini}")
                seen = True
            elif line_clean.startswith("HF_API_KEY=") or line_clean.startswith("SD_MODEL_ID=") or line_clean.startswith("HF_IMAGE_MODEL="):
                # Clean up legacy complex keys
                continue
            else:
                new_lines.append(line)

        if not seen:
            new_lines.append(f"GEMINI_API_KEY={cleaned_gemini}")

        env_path.write_text("\n".join(new_lines) + "\n", encoding="utf-8")


def resolve_gemini_key(user_key: str = None) -> str:
    """Resolves active Gemini API key: prioritizing user input, falling back to .env / os.environ."""
    if user_key and user_key.strip():
        return user_key.strip()
    return GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "").strip()

