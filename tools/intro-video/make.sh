#!/usr/bin/env bash
# Dựng lại video intro docs/t-outbox-intro.mp4 từ văn phòng 3D thật (cần Node 18+, Playwright + Chromium, ffmpeg, Python 3 + numpy).
# Dùng: tools/intro-video/make.sh
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"; root="$here/../.."; work="${WORK:-$(mktemp -d)}"
"$root/scripts/build-web-demo.sh" "$work/site" >/dev/null
cp "$here/director.js" "$work/site/"
# Font Montserrat (kèm bộ chữ tiếng Việt) lấy từ Google Fonts về máy để mọi khung hình dùng đúng font
mkdir -p "$work/site/vfonts"
curl -sSL -A "Mozilla/5.0 Chrome/120" "https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800&display=swap" -o "$work/m.css"
python3 - "$work" <<'PY'
import re, subprocess, sys
w = sys.argv[1]; css = open(w + '/m.css').read()
for i, u in enumerate(sorted(set(re.findall(r'url\((https://[^)]+)\)', css)))):
    subprocess.run(['curl', '-sSL', '-o', f'{w}/site/vfonts/f{i}.woff2', u], check=True); css = css.replace(u, f'f{i}.woff2')
open(w + '/site/vfonts/montserrat.css', 'w').write(css)
PY
(cd "$work/site" && python3 -m http.server 4820 >/dev/null 2>&1) & srv=$!
trap 'kill $srv 2>/dev/null' EXIT
sleep 1
cp "$here/render.js" "$work/render.js"
node "$work/render.js" "$work/video.mp4"
python3 "$here/music.py" "$work/music.wav"
ffmpeg -v error -y -i "$work/video.mp4" -i "$work/music.wav" -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p -c:a aac -b:a 128k -shortest -movflags +faststart "$root/docs/t-outbox-intro.mp4"
ffmpeg -v error -y -ss 3.8 -i "$root/docs/t-outbox-intro.mp4" -frames:v 1 -q:v 3 "$root/docs/t-outbox-intro-poster.jpg"
echo "Xong: docs/t-outbox-intro.mp4"
