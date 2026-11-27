#!/usr/bin/env bash
set -euo pipefail
mode=${1:-dry-run}
[[ "$mode" == dry-run || "$mode" == publish ]] || exit 2
expected=/home/u343461047/domains/jwusinvest.com.br/public_html
[[ "${HOSTINGER_PATH:-}" == "$expected" ]] || { echo 'Unexpected frontend destination' >&2; exit 1; }
[[ "${HOSTINGER_HOST:-}" =~ ^[a-zA-Z0-9.-]+$ && "${HOSTINGER_USER:-}" =~ ^[a-zA-Z0-9_-]+$ && "${HOSTINGER_PORT:-}" =~ ^[0-9]+$ ]] || exit 2
[[ -f .deploy/site/index.html && -f .deploy/site/jw-release.json ]] || exit 1
key=${DEPLOY_KEY_FILE:?}
known=${DEPLOY_KNOWN_HOSTS_FILE:?}
ssh_args=(-F /dev/null -i "$key" -p "$HOSTINGER_PORT" -o BatchMode=yes -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o "UserKnownHostsFile=$known")
remote="$HOSTINGER_USER@$HOSTINGER_HOST"
ssh "${ssh_args[@]}" "$remote" "test \"\$(readlink -f '$expected')\" = '$expected' && test \"\$(readlink -f '$expected/cms')\" = '$expected/cms' && test -d '$expected/cms' && test -f '$expected/.htaccess'"
transport="ssh -F /dev/null -i $key -p $HOSTINGER_PORT -o BatchMode=yes -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=$known"
flags=(-az --checksum --no-times --delete --delay-updates --itemize-changes --exclude=/cms/ --exclude=/.well-known/ --exclude=/.htaccess --exclude=/.user.ini --exclude=/cgi-bin/)
[[ "$mode" != dry-run ]] || flags+=(--dry-run)
rsync "${flags[@]}" -e "$transport" .deploy/site/ "$remote:$expected/"
if [[ "$mode" == publish ]]; then
  ssh "${ssh_args[@]}" "$remote" "test -d '$expected/cms' && test -f '$expected/index.html' && test -f '$expected/jw-release.json'"
fi
