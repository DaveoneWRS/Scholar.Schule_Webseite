#!/usr/bin/env bash
# scholar.schule – holt neue Commits von GitHub (main) auf den Webserver.
# Wird per Cronjob auf dem Server aufgerufen, siehe .deploy/README.md.
# Ausgabe nur bei Aktualisierung oder Fehler, damit das Log klein bleibt.

set -euo pipefail

# Alles in einer Funktion: bash liest das Skript so komplett ein, bevor es
# läuft – wichtig, weil der Pull dieses Skript selbst ersetzen kann.
main() {
  local repo_dir branch local_rev remote_rev
  repo_dir="${REPO_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
  branch="${BRANCH:-main}"

  cd "$repo_dir"

  # Nicht doppelt laufen, falls ein Pull länger als eine Minute hängt
  if command -v flock >/dev/null; then
    exec 9>"/tmp/scholar-auto-pull-$(id -u).lock"
    flock -n 9 || exit 0
  fi

  git fetch --quiet origin "$branch"
  local_rev="$(git rev-parse HEAD)"
  remote_rev="$(git rev-parse "origin/$branch")"

  [ "$local_rev" = "$remote_rev" ] && exit 0

  # Nur vorspulen – lokale Änderungen auf dem Server werden nie überschrieben,
  # stattdessen bricht der Pull ab und der Fehler landet im Log.
  git merge --ff-only --quiet "origin/$branch"

  echo "$(date '+%F %T') aktualisiert: ${local_rev:0:7} -> ${remote_rev:0:7} ($(git log -1 --format=%s))"
}

main "$@"
