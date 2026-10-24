import sys; sys.path.insert(0, "/tmp/claude-0/-home-user/12e952ac-eae9-53b7-b289-1461284fa09f/scratchpad/scripts")
"""Boundary loops of the welded pizza mesh; stats."""
import numpy as np
from fixB_common import *

def boundary_loops(F, nv):
    """F: welded faces. Returns list of loops (arrays of welded vertex ids, oriented consistent with faces), plus
    directed boundary edges."""
    E = np.r_[F[:, [0, 1]], F[:, [1, 2]], F[:, [2, 0]]]
    key = np.minimum(E[:, 0], E[:, 1]) * nv + np.maximum(E[:, 0], E[:, 1])
    uk, inv, cnt = np.unique(key, return_inverse=True, return_counts=True)
    b = cnt[inv] == 1
    Eb = E[b]  # directed as in face (interior on the left when viewed from the front side)
    nxt = {}
    multi = 0
    for a, c in Eb:
        if a in nxt: multi += 1
        nxt.setdefault(a, []).append(c)
    used = set(); loops = []
    for a0, c0 in Eb:
        if (a0, c0) in used: continue
        loop = [a0]; used.add((a0, c0)); cur = c0
        while cur != a0:
            loop.append(cur)
            cands = [c for c in nxt.get(cur, []) if (cur, c) not in used]
            if not cands: break
            c = cands[0]; used.add((cur, c)); cur = c
        loops.append(np.array(loop))
    return loops, Eb, multi

if __name__ == "__main__":
    Vp, UVp, Fp = load_pizza()
    wid = weld(Vp); nw = wid.max() + 1
    Vw = np.zeros((nw, 3)); Vw[wid] = Vp
    Fw = wid[Fp]
    degen = (Fw[:, 0] == Fw[:, 1]) | (Fw[:, 1] == Fw[:, 2]) | (Fw[:, 0] == Fw[:, 2]); print("degenerate welded faces", degen.sum())
    Fw = Fw[~degen]
    loops, Eb, multi = boundary_loops(Fw, nw)
    print("boundary edges %d, non-manifold boundary vertices %d, loops %d" % (len(Eb), multi, len(loops)))
    L = sorted(loops, key=len, reverse=True)
    for lp in L[:15]:
        p = Vw[lp]; per = np.linalg.norm(np.diff(np.r_[p, p[:1]], axis=0), axis=1).sum()
        r = np.hypot(p[:, 0], p[:, 2]); gap = (p[:, 1] - plate_y(p[:, 0], p[:, 2])) * 1e3
        print("loop n=%d perim %.1f mm r %.1f..%.1f gap p5/50/95 %s" % (len(lp), per * 1e3, r.min() * 1e3, r.max() * 1e3, np.percentile(gap, [5, 50, 95]).round(1)))
