from __future__ import annotations

import base64
import re
from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components


ROOT = Path(__file__).parent
ASSETS = ROOT / "assets"


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def image_data_uri(path: Path) -> str:
    suffix = path.suffix.lower().lstrip(".")
    mime = "jpeg" if suffix in {"jpg", "jpeg"} else suffix
    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:image/{mime};base64,{encoded}"


def body_from_index(index_html: str) -> str:
    match = re.search(r"<body[^>]*>(.*?)</body>", index_html, flags=re.IGNORECASE | re.DOTALL)
    if not match:
        raise ValueError("index.html 中没有找到 body 内容")
    return match.group(1).strip()


def build_game_html() -> str:
    index_html = read_text(ROOT / "index.html")
    styles = read_text(ASSETS / "styles.css").replace("</style", "<\\/style")
    script = read_text(ASSETS / "game.js")
    script = script.replace("assets/player.png", image_data_uri(ASSETS / "player.png"))
    script = script.replace("assets/player2.png", image_data_uri(ASSETS / "player2.png"))
    script = script.replace("</script", "<\\/script")
    body = body_from_index(index_html)

    return f"""<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <title>ly的测试游戏 - Streamlit</title>
    <style>
{styles}
    </style>
  </head>
  <body>
{body}
    <script>
{script}
    </script>
  </body>
</html>"""


def main() -> None:
    st.set_page_config(
        page_title="ly的测试游戏",
        layout="wide",
        initial_sidebar_state="collapsed",
    )

    st.markdown(
        """
        <style>
          html, body, [data-testid="stAppViewContainer"], .stApp {
            margin: 0;
            padding: 0;
            background: #000;
            overflow: hidden;
          }

          [data-testid="stHeader"],
          [data-testid="stToolbar"],
          [data-testid="stDecoration"],
          [data-testid="stStatusWidget"] {
            display: none;
          }

          .block-container {
            max-width: none;
            padding: 0;
          }

          iframe {
            display: block;
            width: 100%;
            height: 100svh !important;
            min-height: 0;
            border: 0;
          }
        </style>
        """,
        unsafe_allow_html=True,
    )

    components.html(build_game_html(), height=1, scrolling=False)


if __name__ == "__main__":
    main()
