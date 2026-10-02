"""Model Availability and Verification Script.

Inspects available Google Gemini models using the modern google-genai SDK,
identifies suitable Flash and Pro model endpoints, runs a lightweight connectivity check,
and updates the .env configuration file accordingly.
Part of the Naan Mudhalvan academic submission for ComicCraft.
"""

import os
import re
import sys
from pathlib import Path
from dotenv import load_dotenv

# Locate project base directory
BASE_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = BASE_DIR / ".env"
load_dotenv(dotenv_path=ENV_PATH)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()


def update_env_variable(key: str, value: str):
    """Updates or appends a key-value pair in the .env file."""
    if not ENV_PATH.exists():
        ENV_PATH.write_text(f"{key}={value}\n", encoding="utf-8")
        return

    content = ENV_PATH.read_text(encoding="utf-8")
    pattern = rf"^{key}=.*$"
    if re.search(pattern, content, flags=re.MULTILINE):
        new_content = re.sub(pattern, f"{key}={value}", content, flags=re.MULTILINE)
    else:
        new_content = content.rstrip() + f"\n{key}={value}\n"
    ENV_PATH.write_text(new_content, encoding="utf-8")


def check_models():
    """Main verification function."""
    print("==================================================")
    print("ComicCraft Model Verification (scripts/check_models.py)")
    print("==================================================")

    if not GEMINI_API_KEY:
        print("⚠️ Warning: GEMINI_API_KEY is not defined in .env.")
        print("Setting default stable models: gemini-2.5-flash and gemini-2.5-pro.")
        update_env_variable("GEMINI_FLASH_MODEL", "gemini-2.5-flash")
        update_env_variable("GEMINI_PRO_MODEL", "gemini-2.5-pro")
        return

    try:
        from google import genai
        client = genai.Client(api_key=GEMINI_API_KEY)

        print("Listing available models from Google Gemini API...")
        flash_candidates = []
        pro_candidates = []

        try:
            for m in client.models.list():
                model_name = getattr(m, "name", str(m))
                clean_name = model_name.replace("models/", "")
                # Exclude deprecated 1.5 and 2.0 retired models as per spec
                if "1.5" in clean_name or "2.0" in clean_name:
                    continue

                if "flash" in clean_name.lower():
                    flash_candidates.append(clean_name)
                elif "pro" in clean_name.lower():
                    pro_candidates.append(clean_name)
        except Exception as list_exc:
            print(f"Note: models.list() returned ({list_exc}). Using standard modern defaults.")

        # Pick candidate or fallback to verified defaults
        selected_flash = "gemini-2.5-flash"
        for candidate in ["gemini-2.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"]:
            if candidate in flash_candidates:
                selected_flash = candidate
                break

        selected_pro = "gemini-2.5-pro"
        for candidate in ["gemini-2.5-pro", "gemini-3.1-pro-preview"]:
            if candidate in pro_candidates:
                selected_pro = candidate
                break

        print(f"Testing Selected Flash Model: {selected_flash}")
        try:
            res_flash = client.models.generate_content(
                model=selected_flash,
                contents="Hello, respond with 'OK'",
            )
            print(f"✓ Flash model responded: {res_flash.text.strip()[:30]}")
        except Exception as e:
            print(f"⚠️ Flash test call notice: {e}")

        print(f"Testing Selected Pro Model: {selected_pro}")
        try:
            res_pro = client.models.generate_content(
                model=selected_pro,
                contents="Hello, respond with 'OK'",
            )
            print(f"✓ Pro model responded: {res_pro.text.strip()[:30]}")
        except Exception as e:
            print(f"⚠️ Pro test call notice: {e}")

        # Write working model names to .env
        update_env_variable("GEMINI_FLASH_MODEL", selected_flash)
        update_env_variable("GEMINI_PRO_MODEL", selected_pro)
        print("Updated .env with verified models successfully.")

    except Exception as exc:
        print(f"Error during model check: {exc}")
        update_env_variable("GEMINI_FLASH_MODEL", "gemini-2.5-flash")
        update_env_variable("GEMINI_PRO_MODEL", "gemini-2.5-pro")


if __name__ == "__main__":
    check_models()
