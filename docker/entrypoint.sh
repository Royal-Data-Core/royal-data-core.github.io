#!/bin/sh
# ADR-015 D7 — runtime privilege-drop entrypoint.
#
# WHY: build-time `chown` inside a build layer is not reliably applied to the
# real inode at container runtime on the containerd snapshotter stack
# (measured 2026-10-21: root writes OK, uid 1000 gets EACCES on inodes that
# `ls` reports as owned by 1000/755). Runtime chown is a real kernel call on
# the live overlay — deterministic everywhere.
#
# Contract: start as root (compose does NOT set user:), chown the known
# writable targets to HOST_UID, then exec the CMD as that uid — no process
# ever runs the payload as root (§C11e: no elevated privileges in effect).
set -eu

TARGET_UID="${HOST_UID:-1000}"
TARGET_GID="${HOST_GID:-1000}"

# /app em si precisa ser gravável (mkdir de .astro/, dist/, .linkinator/ —
# não existem na imagem: dockerignore). Chown do diretório, não recursivo.
chown "$TARGET_UID:$TARGET_GID" /app 2>/dev/null || true

for d in /app/node_modules /app/.astro /app/dist /app/.linkinator /app/.lighthouseci; do
    [ -e "$d" ] && chown -R "$TARGET_UID:$TARGET_GID" "$d" 2>/dev/null || true
done

# `--init-groups` exige que o uid exista em /etc/passwd. Em host macOS/Linux
# com uid divergente (ex.: 501) o grupo suplementar não existe — o drop de
# privilégio continua correto, apenas sem grupos extras. Testa a capacidade
# antes de exec'uar (exec que falha encerra o shell).
if setpriv --reuid="$TARGET_UID" --regid="$TARGET_GID" --init-groups -- true 2>/dev/null; then
  exec setpriv --reuid="$TARGET_UID" --regid="$TARGET_GID" --init-groups -- "$@"
fi
exec setpriv --reuid="$TARGET_UID" --regid="$TARGET_GID" -- "$@"

