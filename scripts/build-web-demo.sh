#!/usr/bin/env bash
# Đóng gói bản demo tĩnh của văn phòng T-outbox để đặt lên một website (không cần server local).
# Dùng: scripts/build-web-demo.sh <thư mục đích>
# Bản demo chỉ chạy kịch bản diễn thử với đội và brand mặc định trong office/.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
out="${1:?Cần thư mục đích, ví dụ: scripts/build-web-demo.sh ../website/apps/t-outbox}"

rm -rf "$out"
mkdir -p "$out/data"
cp -R "$root/dashboard/." "$out/"
cp "$root/office/roster.json" "$root/office/brand.json" "$root/office/demo-script.json" "$out/data/"
sed -i 's|<meta charset="utf-8">|<meta charset="utf-8">\n  <meta name="t-outbox-mode" content="web">|' "$out/index.html"
cp "$root/LICENSE" "$out/LICENSE-T-outbox.txt"
cat > "$out/README.md" <<'EOF'
# T-outbox: bản demo trên web

Bản dựng tĩnh của văn phòng 3D T-outbox, sinh bởi `scripts/build-web-demo.sh` trong repo
https://github.com/thecoolestmarperindawurl/t-outbox-office. Không sửa trực tiếp ở đây: sửa ở repo gốc rồi dựng lại.

Mô hình 3D: Kenney (CC0), xem các file License.txt trong assets/. three.js: MIT, xem vendor/LICENSE-three.txt.
EOF
echo "Đã dựng bản demo vào $out"
