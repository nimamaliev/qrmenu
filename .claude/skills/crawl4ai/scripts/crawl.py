#!/usr/bin/env python3
"""
Fetch web pages as clean Markdown with Crawl4AI, for researching reference
and competitor websites (structure, sections, copy patterns).

Usage:
  python crawl.py <url> [<url> ...] [--out research/crawls] [--screenshot]

Writes <out>/<host>_<path>.md (and .png with --screenshot) per URL and prints
a one-line summary for each. Requires `pip install crawl4ai`.
"""
import argparse
import asyncio
import base64
import os
import re
import shutil
import socket
import subprocess
import sys
import tempfile
import time
from contextlib import asynccontextmanager
from urllib.parse import urlparse

try:
    from crawl4ai import AsyncWebCrawler, BrowserConfig, CacheMode, CrawlerRunConfig
except ImportError:
    sys.exit("crawl4ai is not installed. Run: pip install -U crawl4ai && crawl4ai-setup")

# Cloud sessions pre-install a Chromium build that may not match the revision
# crawl4ai's bundled Playwright expects; if launching fails we start that
# binary ourselves and attach over CDP.
PREINSTALLED_CHROMIUM = "/opt/pw-browsers/chromium"


def slug(url: str) -> str:
    p = urlparse(url)
    name = f"{p.netloc}{p.path}".strip("/") or p.netloc
    return re.sub(r"[^A-Za-z0-9._-]+", "_", name)[:120] or "page"


def free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


@asynccontextmanager
async def crawler_for(headless: bool = True):
    try:
        async with AsyncWebCrawler(config=BrowserConfig(headless=headless, verbose=False)) as crawler:
            yield crawler
        return
    except Exception as err:  # noqa: BLE001 - fall back on any launch failure
        if not os.path.exists(PREINSTALLED_CHROMIUM):
            raise
        print(f"default browser launch failed ({type(err).__name__}); using {PREINSTALLED_CHROMIUM}", file=sys.stderr)

    port = free_port()
    profile = tempfile.mkdtemp(prefix="crawl4ai-")
    proc = subprocess.Popen(
        [PREINSTALLED_CHROMIUM, "--headless=new", f"--remote-debugging-port={port}",
         f"--user-data-dir={profile}", "--no-sandbox", "--disable-gpu", "about:blank"],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    try:
        for _ in range(50):
            try:
                socket.create_connection(("127.0.0.1", port), timeout=0.2).close()
                break
            except OSError:
                time.sleep(0.1)
        cfg = BrowserConfig(browser_mode="cdp", cdp_url=f"http://127.0.0.1:{port}", verbose=False)
        async with AsyncWebCrawler(config=cfg) as crawler:
            yield crawler
    finally:
        proc.terminate()
        shutil.rmtree(profile, ignore_errors=True)


async def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("urls", nargs="+")
    ap.add_argument("--out", default="research/crawls")
    ap.add_argument("--screenshot", action="store_true", help="also save a full-page PNG")
    args = ap.parse_args()

    os.makedirs(args.out, exist_ok=True)
    run_cfg = CrawlerRunConfig(cache_mode=CacheMode.BYPASS, screenshot=args.screenshot, verbose=False)
    failures = 0
    async with crawler_for() as crawler:
        for url in args.urls:
            result = await crawler.arun(url=url, config=run_cfg)
            if not result.success:
                failures += 1
                print(f"✗ {url}: {result.error_message}")
                continue
            base = os.path.join(args.out, slug(url))
            markdown = str(result.markdown or "")
            with open(f"{base}.md", "w", encoding="utf-8") as f:
                f.write(f"<!-- source: {url} -->\n\n{markdown}")
            if args.screenshot and result.screenshot:
                with open(f"{base}.png", "wb") as f:
                    f.write(base64.b64decode(result.screenshot))
            title = (result.metadata or {}).get("title") or ""
            print(f"✓ {url} → {base}.md ({len(markdown):,} chars) {title}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
