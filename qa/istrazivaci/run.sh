#!/usr/bin/env bash
set -eu
export NO_AT_BRIDGE=0 GTK_MODULES=gail:atk-bridge XDG_CURRENT_DESKTOP=GNOME
export ORCA_LOG="$RUNNER_TEMP/orca.log"
gsettings set org.gnome.desktop.interface toolkit-accessibility true
openbox >"$RUNNER_TEMP/wm.log" 2>&1 &
pulseaudio --start
speech-dispatcher -d || true
orca --replace --debug --debug-file="$ORCA_LOG" >"$RUNNER_TEMP/orca-out.log" 2>&1 &
sleep 5
if ! /usr/bin/python3 -u qa/istrazivaci/chrome.py; then
    cp "$RUNNER_TEMP/orca-out.log" "$QA_EVIDENCE/orca-konzola.txt"
    if test -f "$ORCA_LOG"; then
        tail -n 450 "$ORCA_LOG" >"$QA_EVIDENCE/orca-zadnji-dogadaji.txt"
    fi
    exit 1
fi
