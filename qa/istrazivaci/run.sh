#!/usr/bin/env bash
set -eu
export NO_AT_BRIDGE=0 GTK_MODULES=gail:atk-bridge
gsettings set org.gnome.desktop.interface toolkit-accessibility true
pulseaudio --start
speech-dispatcher -d || true
orca --replace --debug --debug-file="$RUNNER_TEMP/orca.log" > "$RUNNER_TEMP/orca-out.log" 2>&1 &
sleep 5
/usr/bin/python3 qa/istrazivaci/chrome.py
sleep 3
python3 - <<'PY'
import os, pathlib, re
p=pathlib.Path(os.environ["RUNNER_TEMP"])/"orca.log"
text=p.read_text(errors="replace") if p.exists() else ""
speech=[s for s in text.splitlines() if re.search(r"SPEECH OUTPUT|SPEAKING|Speaking utterance",s,re.I)]
for word in ["Nastavi", "Još nije točno", "Točno!"]:
    hits=[s for s in speech if word.casefold() in s.casefold()]
    print(f"Orca: {word!r} -> {len(hits)} govornih događaja")
    if hits: print(hits[-1][:280])
    if not hits:
        print("Primjer zapisa govora",speech[-8:]); print("Orca početak",text[:900])
        raise SystemExit(1)
PY
