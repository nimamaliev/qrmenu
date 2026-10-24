#!/bin/bash
# usage: final_views.sh OUTDIR GLB PREFIX
S=/tmp/claude-0/-home-user/12e952ac-eae9-53b7-b289-1461284fa09f/scratchpad
O=$1; G=$2; P=$3
$S/venv/bin/python -I -W ignore $S/scripts/plate_render.py $O \
 "$G|${P}top|20deg 40deg 0.65m" \
 "$G|${P}low200|200deg 78deg 0.55m" \
 "$G|${P}side90|90deg 86deg 0.55m" \
 "$G|${P}torn20|20deg 80deg 0.55m" \
 "$G|${P}c190|190deg 78deg 0.24m|-0.0217m 0.03m -0.1231m" \
 "$G|${P}c240|240deg 78deg 0.24m|-0.1083m 0.03m -0.0625m" \
 "$G|${P}c150|150deg 78deg 0.24m|0.0625m 0.03m -0.1083m" \
 "$G|${P}ctear|50deg 78deg 0.24m|0.0958m 0.03m 0.0803m"
