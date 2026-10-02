"""Tests for FastAPI Web and API Routes (app/routes.py).

Uses starlette.testclient.TestClient with mocked pipeline functions.
Verifies GET /, POST /generate, POST /generate-comic/json validation,
and path traversal protection on /download.
"""

from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def mock_run_comic_pipeline(*args, **kwargs):
    """Mock pipeline output to isolate route and template testing."""
    dummy_layout = [
        {
            "panel": 1,
            "title": "A Brave Beginning",
            "image_path": "static/panels/mock/panel_1.png",
            "scene_description": "Rusty looks at the forest.",
            "image_prompt": "Mock prompt 1",
            "caption": "*RUSTLE!*",
            "narration": "Rusty stepped into the trees.",
            "dialogue": [{"speaker": "Rusty", "line": "Let's explore!"}],
            "text": "Full text 1",
            "is_placeholder": True,
        }
    ]
    pdf_path = "/static/exports/mock_comic.pdf"
    meta = {
        "comic_id": "mock123",
        "prompt": "Test prompt",
        "character_name": "Rusty",
        "setting": "Forest",
        "tone": "Light-hearted",
        "style": "Comic Book",
        "models_used": {
            "outline": "mock-flash",
            "story": "mock-pro",
            "image": "placeholder",
        },
    }
    return dummy_layout, pdf_path, meta


def test_get_index_route():
    """GET / must return HTTP 200 with index.html containing the title."""
    response = client.get("/")
    assert response.status_code == 200
    assert "Create Your Comic" in response.text
    assert "Story Prompt" in response.text


@patch("app.routes.run_comic_pipeline", side_effect=mock_run_comic_pipeline)
def test_post_generate_route(mock_pipe):
    """POST /generate must return HTTP 200 and render preview when gemini_api_key is provided."""
    form_data = {
        "prompt": "A brave fox exploring an enchanted forest",
        "character_name": "Rusty",
        "setting": "Forest",
        "tone": "Light-hearted",
        "style": "Comic Book",
        "gemini_api_key": "AIzaSyValidTestKey123",
    }
    response = client.post("/generate", data=form_data)
    assert response.status_code == 200
    assert "Panel 1" in response.text
    assert "Your Comic Preview" in response.text


def test_post_generate_missing_key_validation():
    """POST /generate must reject submissions with empty Gemini API Key and show error banner."""
    form_data = {
        "prompt": "A brave fox exploring an enchanted forest",
        "character_name": "Rusty",
        "setting": "Forest",
        "tone": "Light-hearted",
        "style": "Comic Book",
        "gemini_api_key": "   ",
    }
    response = client.post("/generate", data=form_data)
    assert response.status_code == 200
    assert "Google Gemini API Key is mandatory" in response.text


def test_json_endpoint_bad_input_validation():
    """POST /generate-comic/json must return 422 Unprocessable Entity for invalid input."""
    # Prompt is too short (< 5 chars)
    payload = {
        "prompt": "hi",
        "character_name": "Rusty",
        "setting": "Forest",
        "tone": "Light-hearted",
        "style": "Comic Book",
        "gemini_api_key": "AIzaSyTestKey123",
    }
    response = client.post("/generate-comic/json", json=payload)
    assert response.status_code == 422


def test_download_blocks_path_traversal():
    """GET /download must reject path traversal attempts with 403 Forbidden."""
    traversal_path = "../../etc/passwd"
    response = client.get(f"/download?pdf_path={traversal_path}")
    assert response.status_code in [403, 404]


@patch("app.routes.run_comic_pipeline", side_effect=mock_run_comic_pipeline)
def test_post_generate_with_user_api_key(mock_pipe):
    """POST /generate must accept custom gemini_api_key and pass it to the pipeline."""
    form_data = {
        "prompt": "A magical adventure in the mountains",
        "character_name": "Luna",
        "setting": "Forest",
        "tone": "Poetic",
        "style": "Anime",
        "gemini_api_key": "AIzaSyTestUserKey123",
    }
    response = client.post("/generate", data=form_data)
    assert response.status_code == 200
    assert mock_pipe.called
    kwargs = mock_pipe.call_args.kwargs
    assert kwargs.get("gemini_api_key") == "AIzaSyTestUserKey123"


def test_api_settings_keys_endpoints():
    """Verifies POST /api/settings/keys and GET /api/settings/keys."""
    # Test setting key
    post_res = client.post(
        "/api/settings/keys",
        json={"gemini_api_key": "AIzaSyCustomKey999"},
    )
    assert post_res.status_code == 200
    assert post_res.json()["gemini_configured"] is True

    # Test status check without exposing raw keys
    get_res = client.get("/api/settings/keys")
    assert get_res.status_code == 200
    assert "gemini_configured" in get_res.json()

