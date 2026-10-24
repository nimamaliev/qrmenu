"""Usage: plate_render.py OUTDIR 'file.glb|name|orbit[|target[|fov]]' ...  (file relative to cake/out, served on :8765)"""
import asyncio, sys
from urllib.parse import quote
from playwright.async_api import async_playwright
outdir = sys.argv[1]; jobs = [a.split("|") for a in sys.argv[2:]]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
                                    args=["--enable-unsafe-swiftshader", "--use-angle=swiftshader", "--no-sandbox", "--no-proxy-server"])
        for j in jobs:
            f, name, orbit = j[:3]; target = j[3] if len(j) > 3 and j[3] else "0m 0.015m 0m"; fov = j[4] if len(j) > 4 else "30deg"
            pg = await b.new_page(viewport={"width": 600, "height": 500})
            await pg.goto(f"http://127.0.0.1:8765/one.html?src={f}&orbit={quote(orbit)}")
            await pg.evaluate(f"(()=>{{const m=document.getElementById('mv');m.setAttribute('camera-target','{target}');m.setAttribute('field-of-view','{fov}');m.setAttribute('min-camera-orbit','auto auto 0.01m');m.setAttribute('min-field-of-view','5deg');}})()")
            await pg.wait_for_function("window.loaded===true || window.err", timeout=300000)
            err = await pg.evaluate("window.err||''")
            await pg.wait_for_timeout(3500)
            await pg.screenshot(path=f"{outdir}/{name}.png"); print(name, err, flush=True)
            await pg.close()
        await b.close()
asyncio.run(main())
