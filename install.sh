#!/usr/bin/env bash
# Install the cyber-particle plugin into the current DSH web profile.
# Idempotent: re-running only refreshes the package files and keeps the patch row.
set -euo pipefail

DSH_HOME="${DSH_HOME:-$HOME/.dsh}"
PROFILE="$DSH_HOME/profiles/web"
PKG="$PROFILE/node_modules/cyber-particle"
PATCH="$PROFILE/cordis.patch.yml"

if [ ! -d "$PROFILE" ]; then
  echo "error: web profile not found at $PROFILE (is DSH_HOME correct?)" >&2
  exit 1
fi

# 1. Package files
mkdir -p "$PKG"
cp package.json index.js client.js "$PKG/"
echo "installed package files -> $PKG"

# 2. Patch row (insert block, appended only if missing)
if [ -f "$PATCH" ] && grep -q 'id: cyber-particle' "$PATCH"; then
  echo "patch row already present in $PATCH"
else
  INSERT_BLOCK='- insert:
    - id: cyber-particle
      name: cyber-particle
'
  if [ ! -f "$PATCH" ] || [ ! -s "$PATCH" ] || grep -qE '^\s*\[\s*\]\s*$' "$PATCH"; then
    cat > "$PATCH" <<YAML
# Your patch layer for this dsh profile, applied after every bundle layer:
# a top-level YAML array of loader patch entries (id-targeted config
# overrides, disables, and insert lists; \`!!js\` expressions allowed).

$INSERT_BLOCK
YAML
  else
    printf '\n%s' "$INSERT_BLOCK" >> "$PATCH"
  fi
  echo "added patch row to $PATCH"
fi

cat <<'NOTE'

Done. Restart dsh web (kill the running `dsh web` process, then run `dsh web`
again) for the profile change to take effect. The plugin then loads on every
startup automatically.
NOTE
