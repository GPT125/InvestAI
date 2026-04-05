#!/usr/bin/env bash
# One-command deploy: commit everything + push to Vercel production
set -e
cd "$(dirname "$0")"

echo "📦 Staging all changes..."
git add -A

# Only commit if there are staged changes
if git diff --cached --quiet; then
  echo "ℹ️  Nothing to commit — deploying current HEAD"
else
  MSG="${1:-Update}"
  git commit -m "$MSG"
  echo "✅ Committed: $MSG"
fi

echo "🚀 Deploying to Vercel..."
npx vercel --prod --yes

echo ""
echo "✅ Live at https://stockai-platform-theta.vercel.app"
echo "✅ Also at  https://stockai-pro.vercel.app"
