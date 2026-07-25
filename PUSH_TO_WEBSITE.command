#!/bin/bash
cd "$(dirname "$0")"
echo ""
echo "  Publishing Fault Lines Capital to faultlinescapital.com"
echo ""
python3 << 'PY'
import json
posts = json.load(open('posts.json'))
with open('posts-data.js', 'w', encoding='utf-8') as f:
    f.write('window.FLC_POSTS = ')
    json.dump(posts, f, ensure_ascii=False)
    f.write(';\n')
print(f"  Synced {len(posts)} articles to posts-data.js")
PY
git add posts.json posts-data.js script.js index.html
git diff --cached --quiet || git commit -m "Publish latest articles to live site."
git push origin main
echo ""
if [ $? -eq 0 ]; then
  echo "  Done. Refresh https://faultlinescapital.com in 1-2 minutes."
else
  echo "  Push failed. Sign in when prompted, then run this file again."
fi
echo ""
read -p "Press Enter to close…"
