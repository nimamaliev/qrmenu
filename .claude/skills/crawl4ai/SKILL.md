---
name: crawl4ai
description: Research reference and competitor websites by crawling them into clean Markdown (and optional full-page screenshots) with Crawl4AI (github.com/unclecode/crawl4ai). Use when planning or benchmarking the QRMenu marketing site — e.g. "look at how other QR menu / restaurant SaaS sites structure their landing page, pricing, or feature sections" — or when the user gives URLs of sites they like.
---

# Crawl4AI: website research

Crawl4AI is an open-source Python crawler that renders pages in a real
browser and returns LLM-friendly Markdown. We use it to study other websites
(their section order, messaging, pricing layout, calls to action) before
designing ours. It's a research tool and never ships with the site.

## Setup (once per machine/session)

```bash
pip install -U crawl4ai
crawl4ai-setup   # downloads a browser; can be skipped in cloud sessions
```

In Claude Code cloud sessions the browser download is unnecessary: the script
falls back to the pre-installed Chromium at `/opt/pw-browsers/chromium`.

## Crawl

```bash
python .claude/skills/crawl4ai/scripts/crawl.py https://site-a.example https://site-b.example/pricing --screenshot
```

Output goes to `research/crawls/<host>_<path>.md` (+ `.png` with
`--screenshot`). Read the Markdown for structure and copy patterns. To study
the visual design, open the PNG and use the `screenshot-to-code` skill's rules.

## Network caveat

Cloud sessions only reach hosts allowed by the environment's network policy.
A host that isn't allowed fails with `CONNECT tunnel failed, response 403`.
When that happens, tell the user. Either they widen the environment's network
access (see the `read_documentation` tool, topic `environment.network`), or
they run the same command on their own machine and commit the files in
`research/crawls/`. Don't try to route around the policy.

## Use the research responsibly

- Extract *patterns* (section order, what proof they show, how pricing is
  framed). Never copy competitors' text, images, logos or branding into
  our site.
- Crawl only a handful of public pages, never bulk-scrape, and respect a site's
  robots.txt and terms.
- Summarize findings for the user as a short comparison: what each site does
  well and what we'll do differently.
