#!/usr/bin/env bash
set -eu
export NO_AT_BRIDGE=0 GTK_MODULES=gail:atk-bridge XDG_CURRENT_DESKTOP=GNOME
gsettings set org.gnome.desktop.interface toolkit-accessibility true
openbox >"$RUNNER_TEMP/wm.log" 2>&1 &
pulseaudio --start
speech-dispatcher -d || true
orca --replace --debug --debug-file="$RUNNER_TEMP/orca.log" > "$RUNNER_TEMP/orca-out.log" 2>&1 &
sleep 5
/usr/bin/python3 -u qa/istrazivaci/chrome.py || { tail -c 1400 "$RUNNER_TEMP/orca-out.log"; exit 1; }
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
        print("Primjer zapisa govora",speech[-8:]); print("Orca početak",text[:900]); print("Orca konzola",(p.parent/"orca-out.log").read_text(errors="replace")[-1800:]); print("Dijagnostika",[s[:250] for s in text.splitlines() if word.casefold() in s.casefold()][-10:])
        raise SystemExit(1)
PY
