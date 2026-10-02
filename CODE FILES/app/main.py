"""ComicCraft FastAPI Main Application.

Entry point for the ComicCraft AI Comic Story Creator web application.
Configures logging, static file serving, routes, and lifecycle events.
Part of the Naan Mudhalvan academic submission.
"""

import logging
import sys
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.config import (
    BASE_DIR,
    EXPORTS_DIR,
    FONTS_DIR,
    IMAGES_DIR,
    PANELS_DIR,
    PORT,
    STATIC_DIR,
)
from app.routes import router

# Load environment variables
load_dotenv(dotenv_path=BASE_DIR / ".env")

# Configure application logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("comiccraft")

# Initialize FastAPI application with exact title
app = FastAPI(
    title="ComicCraft",
    description="AI Comic Story Creator using Gemini Models and Multi-Backend Image Generation",
    version="1.0.0",
)

# Ensure runtime directories exist
for directory in [PANELS_DIR, EXPORTS_DIR, FONTS_DIR, IMAGES_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# Mount the static directory for images, CSS, fonts, and PDF downloads
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# Include web and API routes
app.include_router(router)


@app.on_event("startup")
def on_startup():
    """Startup event ensuring all assets and directories are initialized."""
    logger.info("==================================================")
    logger.info("ComicCraft AI Comic Story Creator is starting...")
    logger.info("Base Directory: %s", BASE_DIR)
    logger.info("Static Directory: %s", STATIC_DIR)
    logger.info("Serving at port: %d", PORT)
    logger.info("==================================================")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=PORT, reload=True)
