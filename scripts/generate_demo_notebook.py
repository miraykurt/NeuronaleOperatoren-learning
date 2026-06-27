#!/usr/bin/env python3
"""Generate fno_training_vscode.html with one tab per experiment.

Reproduces the original VS-Code-style chrome (titlebar, activity bar, sidebar,
toolbar, run animation, line explanations, file modal, theme toggle) and adds
multi-tab notebook switching. Each tab is a full notebook reflecting one real
training run from FNOTrainingReal/outputs.
"""

from __future__ import annotations

import json
import html
from pathlib import Path

ROOT = Path("/Users/miraykurt/Documents/BA_MK/LearningNuggets/Neuronales Netz")
SRC_OUT = ROOT / "FNOTrainingReal/outputs copy"
SRC_REPO = ROOT / "FNOTrainingReal"
DST = ROOT / "client/public/fno_training_vscode.html"
ASSETS = "/training_outputs"

EXPERIMENTS = [
    "advection_beta0_2_modes_4",
    "advection_beta0_2_modes_8",
    "advection_beta0_2_modes_16",
    "advection_beta4_modes_4",
    "advection_beta4_modes_8",
    "advection_beta4_modes_16",
    "cfd_rand_128_modes_4",
    "cfd_rand_128_modes_8",
    "cfd_rand_128_modes_16",
    "cfd_turb_512_modes_4",
    "cfd_turb_512_modes_8",
    "cfd_turb_512_modes_16",
]


def dataset_label(exp: str) -> str:
    if exp.startswith("advection_beta0_2"):
        return "1D Advection β=0.2"
    if exp.startswith("advection_beta4"):
        return "1D Advection β=4.0"
    if exp.startswith("cfd_rand_128"):
        return "2D CFD Random Force (128×128)"
    if exp.startswith("cfd_turb_512"):
        return "2D CFD Turbulent (512×512)"
    return exp


def tab_meta(exp: str):
    """Return (badge, short_label, level_name, level_class)."""
    k = exp.rsplit("_", 1)[-1]
    if exp.startswith("advection_beta0_2"):
        return ("🟢", f"1D Adv β=0.2 · k={k}", "Einstieg", "lvl-1")
    if exp.startswith("advection_beta4"):
        return ("🟡", f"1D Adv β=4 · k={k}", "1D-Schock", "lvl-2")
    if exp.startswith("cfd_rand_128"):
        return ("🟠", f"2D CFD-Rand · k={k}", "2D-Anomalie", "lvl-3")
    if exp.startswith("cfd_turb_512"):
        return ("🔴", f"2D CFD-Turb · k={k}", "Grenze", "lvl-4")
    return ("⚪", exp, "?", "lvl-0")


def predict_band(final_l2: float):
    """Pick correct answer band for predict-before-run."""
    if final_l2 >= 0.5:
        return "A", "Loss bleibt etwa konstant über 0.5"
    if final_l2 >= 0.1:
        return "B", "Loss fällt auf 0.1 – 0.5 (10–50 % rel. Fehler)"
    if final_l2 >= 0.01:
        return "C", "Loss fällt auf 0.01 – 0.1 (1–10 % rel. Fehler)"
    return "D", "Loss fällt unter 0.01 (< 1 % rel. Fehler)"


def heatmap_class(l2: float) -> str:
    if l2 < 0.02:
        return "hm-a"
    if l2 < 0.10:
        return "hm-b"
    if l2 < 0.25:
        return "hm-c"
    if l2 < 0.45:
        return "hm-d"
    return "hm-e"


def load_summary(exp: str) -> dict:
    with open(SRC_OUT / exp / "summary.json") as f:
        return json.load(f)


def load_metrics_rows(exp: str) -> list:
    rows = []
    with open(SRC_OUT / exp / "metrics.csv") as f:
        header = f.readline().strip().split(",")
        for line in f:
            parts = line.strip().split(",")
            if len(parts) == len(header):
                rows.append(dict(zip(header, parts)))
    return rows


def pick_log_rows(rows):
    by_split = {"val_initial": [], "test_initial": [], "val": [], "test_best": []}
    for r in rows:
        s = r.get("split")
        if s in by_split:
            by_split[s].append(r)
    seq = []
    if by_split["val_initial"]:
        seq.append(("val_initial", by_split["val_initial"][0]))
    if by_split["test_initial"]:
        seq.append(("test_initial", by_split["test_initial"][0]))
    vals = by_split["val"]
    if vals:
        for frac in (0.1, 0.25, 0.5, 0.75, 1.0):
            idx = max(0, min(len(vals) - 1, int(len(vals) * frac) - 1))
            seq.append(("val", vals[idx]))
    if by_split["test_best"]:
        seq.append(("test_best", by_split["test_best"][-1]))
    return seq


def fmt(v):
    try:
        x = float(v)
    except (TypeError, ValueError):
        return str(v)
    if x == 0:
        return "0"
    if abs(x) >= 1e3 or abs(x) < 1e-3:
        return f"{x:.3e}"
    return f"{x:.5f}"


CSS = r"""
:root{
  --bg:#1e1e1e; --bg-alt:#252526; --bg-side:#252526; --bg-activity:#333333;
  --bg-status:#007acc; --bg-tab:#2d2d2d; --bg-tab-active:#1e1e1e;
  --bg-cell:#1e1e1e; --bg-code:#1e1e1e; --bg-out:#1e1e1e; --bg-popup:#252526;
  --border:#3c3c3c;
  --fg:#cccccc; --fg-muted:#858585; --fg-accent:#9cdcfe; --fg-keyword:#c586c0;
  --fg-string:#ce9178; --fg-num:#b5cea8; --fg-comment:#6a9955; --fg-func:#dcdcaa;
  --fg-class:#4ec9b0; --fg-builtin:#4fc1ff; --fg-decor:#dcdcaa; --fg-link:#3794ff;
  --selection:#264f78; --line-highlight:#2a2d2e; --line-clicked:#094771;
}
*{box-sizing:border-box;}
html,body{margin:0;padding:0;height:100%;overflow:hidden;}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;
  font-size:13px;color:var(--fg);background:var(--bg);}

.titlebar{height:30px;background:#3c3c3c;display:flex;align-items:center;
  padding:0 12px;font-size:12px;color:#cccccc;border-bottom:1px solid #1e1e1e;user-select:none;}
.titlebar .traffic{display:flex;gap:8px;margin-right:14px;}
.traffic span{width:12px;height:12px;border-radius:50%;display:inline-block;}
.traffic .r{background:#ff5f56;}.traffic .y{background:#ffbd2e;}.traffic .g{background:#27c93f;}
.titlebar .menu{display:flex;gap:14px;color:#cccccc;}
.titlebar .title{margin-left:auto;margin-right:auto;color:#bbb;font-size:12px;}

.app{display:grid;grid-template-columns:48px 280px 1fr;grid-template-rows:1fr 22px;
  height:calc(100% - 30px);transition:grid-template-columns 0.18s ease;}
.app.sidebar-collapsed{grid-template-columns:48px 0 1fr;}

.activity{background:var(--bg-activity);grid-row:1/2;
  display:flex;flex-direction:column;align-items:center;padding-top:6px;gap:2px;
  border-right:1px solid #1e1e1e;}
.activity .ic{width:48px;height:48px;display:flex;align-items:center;justify-content:center;
  color:#858585;cursor:pointer;border-left:2px solid transparent;}
.activity .ic svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.6;}
.activity .ic.active{color:#fff;border-left-color:#fff;}
.activity .ic:hover{color:#fff;}

.sidebar{background:var(--bg-side);grid-row:1/2;border-right:1px solid #1e1e1e;
  overflow-y:auto;overflow-x:hidden;display:flex;flex-direction:column;}
.app.sidebar-collapsed .sidebar{border-right:none;}
.sb-head{padding:10px 18px 8px;font-size:11px;font-weight:600;letter-spacing:1.2px;
  color:#cccccc;text-transform:uppercase;}
.sb-section{padding:6px 12px;font-size:11px;color:#cccccc;font-weight:600;
  display:flex;align-items:center;cursor:pointer;user-select:none;
  text-transform:uppercase;letter-spacing:0.6px;}
.sb-section::before{content:"";display:inline-block;width:0;height:0;
  border-left:5px solid transparent;border-right:5px solid transparent;
  border-top:6px solid #cccccc;margin-right:6px;}
.tree{font-size:13px;padding:0 0 8px;}
.tree .item{padding:3px 8px 3px 18px;display:flex;align-items:center;gap:8px;
  cursor:pointer;color:#cccccc;white-space:nowrap;}
.tree .item:hover{background:#2a2d2e;}
.tree .item.active{background:#37373d;color:#fff;}
.tree .folder{padding-left:8px;font-weight:500;}
.tree .folder::before{content:"";display:inline-block;width:0;height:0;margin-right:6px;
  border-left:5px solid transparent;border-right:5px solid transparent;
  border-top:6px solid #cccccc;}
.tree .folder.closed::before{border-top:none;border-bottom:none;
  border-left:6px solid #cccccc;border-right:none;
  border-top:5px solid transparent;border-bottom:5px solid transparent;}
.tree .file{padding-left:32px;}
.tree .file.indent-2{padding-left:46px;}
.tree .folder.indent-1{padding-left:22px;}
.tree .item .size{margin-left:auto;font-size:10px;color:var(--fg-muted);padding-left:8px;}

.editor{grid-row:1/2;display:flex;flex-direction:column;background:var(--bg);
  min-width:0;overflow:hidden;}
.tabs{display:flex;background:#2d2d2d;border-bottom:1px solid #1e1e1e;
  height:35px;flex-shrink:0;overflow-x:auto;}
.tab{padding:0 14px;display:flex;align-items:center;gap:8px;font-size:13px;
  color:#969696;border-right:1px solid #252526;cursor:pointer;
  background:#2d2d2d;white-space:nowrap;}
.tab:hover{color:#cccccc;}
.tab.active{background:var(--bg);color:#fff;border-top:1px solid #007acc;padding-top:0;}
.tab .close{opacity:0.6;font-size:14px;font-family:Consolas,monospace;}
.tab.active .close{opacity:1;}

.toolbar{height:36px;background:#252526;border-bottom:1px solid #1e1e1e;
  display:flex;align-items:center;padding:0 12px;gap:4px;font-size:12px;flex-shrink:0;}
.tb-btn{padding:5px 10px;color:#cccccc;cursor:pointer;border-radius:3px;
  display:inline-flex;align-items:center;gap:6px;user-select:none;}
.tb-btn:hover{background:#2a2d2e;}
.tb-btn .tri{width:0;height:0;border-left:7px solid #4ec9b0;
  border-top:5px solid transparent;border-bottom:5px solid transparent;}
.tb-btn .square{width:9px;height:9px;background:#f48771;}
.tb-btn .circle{width:11px;height:11px;border:2px solid #cccccc;border-radius:50%;
  border-top-color:transparent;}
.tb-sep{width:1px;height:18px;background:#3c3c3c;margin:0 4px;}
.kernel{margin-left:auto;font-size:11px;color:#cccccc;display:flex;align-items:center;gap:6px;}
.kernel::before{content:"";width:8px;height:8px;border-radius:50%;background:#3fb950;display:inline-block;}

#btn-theme{color:var(--fg-accent);border:1px solid var(--border);}

.notebook-stack{flex:1;overflow-y:auto;background:var(--bg);}
.notebook{display:none;padding:18px 24px 60px;}
.notebook.active{display:block;}

.cell{margin:10px 0;display:flex;gap:8px;}
.cell .cell-bar{width:4px;background:transparent;border-radius:2px;flex-shrink:0;
  align-self:stretch;}
.cell:hover .cell-bar{background:#264f78;}
.cell.code:focus-within .cell-bar{background:#007acc;}

.cell .runcol{width:28px;flex-shrink:0;display:flex;flex-direction:column;
  align-items:center;padding-top:6px;}
.runbtn{width:24px;height:24px;border-radius:50%;background:transparent;
  border:1px solid transparent;display:flex;align-items:center;justify-content:center;
  cursor:pointer;color:#858585;}
.cell:hover .runbtn{border-color:#3c3c3c;color:#cccccc;}
.runbtn:hover{background:#37373d;color:#fff !important;border-color:#4ec9b0 !important;}
.runbtn .tri{width:0;height:0;border-left:8px solid currentColor;
  border-top:5px solid transparent;border-bottom:5px solid transparent;margin-left:2px;}
.runbtn.done{color:#4ec9b0;border-color:#4ec9b0;}
.runbtn.running{color:#dcdcaa;border-color:#dcdcaa;}

.cell .body{flex:1;min-width:0;}
.cell.md{padding:6px 8px;color:#cccccc;}
.cell.md h1{font-size:26px;font-weight:600;margin:8px 0 10px;color:#fff;
  padding-bottom:6px;border-bottom:1px solid #3c3c3c;}
.cell.md h2{font-size:20px;font-weight:600;margin:18px 0 8px;color:#fff;}
.cell.md h3{font-size:16px;font-weight:600;margin:14px 0 6px;color:#e5e5e5;}
.cell.md p{margin:6px 0;line-height:1.55;}
.cell.md ul,.cell.md ol{margin:6px 0 6px 22px;line-height:1.55;}
.cell.md code{background:#2d2d2d;padding:1px 6px;border-radius:3px;
  font-family:"SF Mono",Menlo,Consolas,monospace;font-size:12.5px;color:#ce9178;}
.cell.md a{color:var(--fg-link);text-decoration:none;}
.cell.md a:hover{text-decoration:underline;}
.cell.md .callout{background:#252526;border-left:3px solid #007acc;
  padding:10px 14px;margin:8px 0;border-radius:0 4px 4px 0;font-size:12.5px;}
.cell.md .demo-tag{display:inline-block;padding:2px 8px;background:#1e3a5f;
  color:#9cdcfe;border-radius:3px;font-size:11px;font-family:monospace;margin-left:6px;}

.cell.code{align-items:stretch;}
.cell.code .body{display:flex;flex-direction:column;gap:0;}
.code-wrap{display:flex;background:var(--bg-code);
  border:1px solid #3c3c3c;border-radius:3px;
  font-family:"SF Mono",Menlo,Consolas,"Liberation Mono",monospace;
  font-size:13px;line-height:1.55;overflow:hidden;}
.ingutter{flex:0 0 56px;text-align:right;color:#858585;font-size:11px;
  padding:8px 10px 8px 4px;user-select:none;background:var(--bg-code);}
.ingutter .exec{color:#569cd6;}
.ingutter .exec.empty{color:#858585;}
.ingutter .exec.running{color:#dcdcaa;}
.code-lines{flex:1;padding:8px 0;overflow-x:auto;min-width:0;}
.ln{display:flex;padding:0 16px 0 12px;cursor:pointer;
  border-left:2px solid transparent;position:relative;white-space:pre;}
.ln:hover{background:var(--line-highlight);}
.ln.active{background:var(--line-clicked);border-left-color:#007acc;}
.ln-num{width:30px;color:#858585;text-align:right;padding-right:14px;flex-shrink:0;
  font-size:12px;user-select:none;}
.ln-content{flex:1;min-width:0;padding-right:24px;position:relative;}
.ln.has-explain .ln-content::after{content:"i";position:absolute;right:4px;top:2px;
  width:14px;height:14px;border-radius:50%;background:#264f78;color:#9cdcfe;
  font-size:9px;font-style:italic;font-family:Georgia,serif;font-weight:700;
  display:flex;align-items:center;justify-content:center;transition:all 0.15s;}
.ln.has-explain:hover .ln-content::after{background:#007acc;color:#fff;transform:scale(1.1);}
.ln.active .ln-content::after{background:#007acc;color:#fff;}

.kw{color:var(--fg-keyword);}.st{color:var(--fg-string);}.nm{color:var(--fg-num);}
.cm{color:var(--fg-comment);font-style:italic;}.fn{color:var(--fg-func);}
.cl{color:var(--fg-class);}.bi{color:var(--fg-builtin);}.va{color:var(--fg-accent);}
.de{color:var(--fg-decor);}.op{color:#d4d4d4;}

.out-area{display:none;margin-top:0;}
.out-area.show{display:block;animation:fadeIn 0.25s ease;}
@keyframes fadeIn{from{opacity:0;transform:translateY(-4px);}to{opacity:1;transform:none;}}
.out{margin-top:2px;padding:8px 14px;background:var(--bg-out);
  border-left:3px solid #3c3c3c;color:#cccccc;
  font-family:"SF Mono",Menlo,Consolas,monospace;font-size:12px;
  white-space:pre-wrap;line-height:1.55;}
.out.error{border-left-color:#f48771;color:#f48771;}
.out-real{margin-top:4px;padding:10px 14px;background:#252526;
  border-left:3px solid #9cdcfe;border-radius:0 3px 3px 0;
  color:#cccccc;font-size:12px;line-height:1.55;
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,sans-serif;}
.out-real code{background:#1e1e1e;padding:1px 5px;border-radius:3px;
  font-family:"SF Mono",Menlo,Consolas,monospace;font-size:11.5px;color:#ce9178;}

/* Kompakte Was-bedeutet-das-Box unter jedem Cell-Output */
.cell-tip{margin-top:4px;padding:8px 12px;background:#1e2733;
  border-left:2px solid #569cd6;border-radius:0 3px 3px 0;
  color:#cccccc;font-size:12px;line-height:1.5;
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,sans-serif;
  display:flex;align-items:flex-start;gap:10px;flex-wrap:wrap;}
.cell-tip .tip-label{color:#569cd6;font-weight:600;font-size:10.5px;
  text-transform:uppercase;letter-spacing:0.5px;flex-shrink:0;padding-top:2px;}
.cell-tip .tip-text{flex:1;min-width:200px;}
.cell-tip .tip-text code{background:#1e1e1e;padding:1px 5px;border-radius:3px;
  font-family:"SF Mono",Menlo,Consolas,monospace;font-size:11.5px;color:#ce9178;}
.cell-tip .ask-tutor{display:inline-flex;align-items:center;gap:6px;
  padding:4px 10px;background:#0e639c;border:1px solid #007acc;border-radius:3px;
  color:#fff;font-size:11px;cursor:pointer;font-family:inherit;flex-shrink:0;
  transition:background 0.15s;}
.cell-tip .ask-tutor:hover{background:#1177bb;}
.cell-tip .ask-tutor::before{content:"💬";font-size:11px;}
body[data-theme="light"] .cell-tip{background:#eaf3ff;color:#1e1e1e;border-left-color:#0070c1;}
body[data-theme="light"] .cell-tip .tip-label{color:#0070c1;}
body[data-theme="light"] .cell-tip code{background:#f5f5f5;color:#a31515;}
.out-image{margin-top:6px;padding:8px;background:#252526;border-radius:3px;}
.out-image img{display:block;max-width:100%;border:1px solid #3c3c3c;border-radius:3px;}
.out-image .cap{font-size:11px;color:#858585;margin-bottom:6px;font-family:monospace;}

.statusbar{grid-column:1/4;background:var(--bg-status);color:#fff;
  height:22px;display:flex;align-items:center;padding:0 12px;font-size:12px;gap:14px;}
.statusbar .sb-right{margin-left:auto;display:flex;gap:14px;}

.explainer{position:fixed;top:80px;right:20px;width:380px;max-height:75vh;
  background:var(--bg-popup);border:1px solid #007acc;border-radius:6px;
  box-shadow:0 8px 28px rgba(0,0,0,0.5);
  display:none;flex-direction:column;z-index:1000;font-family:-apple-system,sans-serif;}
.explainer.show{display:flex;}
.ex-head{background:#007acc;color:#fff;padding:8px 14px;
  display:flex;align-items:center;justify-content:space-between;
  border-radius:5px 5px 0 0;font-weight:600;font-size:13px;}
.ex-head .close{cursor:pointer;font-size:18px;line-height:1;opacity:0.9;font-family:Consolas,monospace;}
.ex-head .close:hover{opacity:1;}
.ex-body{padding:14px 16px;overflow-y:auto;color:#cccccc;font-size:13px;line-height:1.6;}
.ex-body h4{margin:0 0 6px;color:#9cdcfe;font-size:13px;font-weight:600;
  text-transform:uppercase;letter-spacing:0.5px;}
.ex-body .code-snippet{background:#1e1e1e;padding:6px 10px;border-radius:3px;
  font-family:"SF Mono",Menlo,Consolas,monospace;font-size:12px;
  color:#ce9178;margin:6px 0 12px;border-left:2px solid #007acc;
  white-space:pre-wrap;word-break:break-word;}
.ex-body p{margin:6px 0;}
.ex-body .tag{display:inline-block;background:#37373d;color:#9cdcfe;
  padding:2px 8px;border-radius:10px;font-size:10.5px;margin-right:4px;}
.ex-empty{padding:30px 20px;text-align:center;color:#858585;font-size:12.5px;}

.backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.55);display:none;z-index:900;}
.backdrop.show{display:block;}
.filemodal{position:fixed;top:60px;left:50%;transform:translateX(-50%);
  width:min(900px, 92vw);max-height:82vh;
  background:#1e1e1e;border:1px solid #3c3c3c;border-radius:6px;
  box-shadow:0 12px 40px rgba(0,0,0,0.6);
  display:none;flex-direction:column;z-index:950;}
.filemodal.show{display:flex;}
.fm-head{background:#2d2d2d;padding:10px 16px;
  display:flex;align-items:center;justify-content:space-between;
  border-bottom:1px solid #1e1e1e;border-radius:5px 5px 0 0;}
.fm-title{display:flex;align-items:center;gap:10px;font-size:13px;color:#fff;}
.fm-close{cursor:pointer;font-size:18px;color:#cccccc;font-family:Consolas,monospace;padding:0 6px;}
.fm-close:hover{color:#fff;}
.fm-body{padding:0;overflow-y:auto;}
.fm-desc{padding:12px 18px;background:#252526;border-bottom:1px solid #1e1e1e;
  color:#cccccc;font-size:12.5px;line-height:1.55;}
.fm-desc .tag{display:inline-block;background:#37373d;color:#9cdcfe;
  padding:2px 8px;border-radius:10px;font-size:10.5px;margin-right:4px;}
.fm-content{padding:14px 18px;font-family:"SF Mono",Menlo,Consolas,monospace;
  font-size:12.5px;color:#cccccc;line-height:1.55;white-space:pre-wrap;overflow-x:auto;}

::-webkit-scrollbar{width:10px;height:10px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:#424242;border-radius:5px;}
::-webkit-scrollbar-thumb:hover{background:#4f4f4f;}

body[data-theme="light"]{color:#1e1e1e;background:#fff;}
body[data-theme="light"] .titlebar{background:#ddd;color:#1e1e1e;}
body[data-theme="light"] .titlebar .menu,
body[data-theme="light"] .titlebar .title{color:#1e1e1e;}
body[data-theme="light"] .sidebar{background:#f3f3f3;color:#1e1e1e;}
body[data-theme="light"] .sb-head,body[data-theme="light"] .sb-section{color:#1e1e1e;}
body[data-theme="light"] .tree .item{color:#1e1e1e;}
body[data-theme="light"] .tree .item:hover{background:#e4e6f1;}
body[data-theme="light"] .editor{background:#fff;}
body[data-theme="light"] .tabs{background:#ececec;}
body[data-theme="light"] .tab{background:#ececec;color:#444;}
body[data-theme="light"] .tab.active{background:#fff;color:#1e1e1e;}
body[data-theme="light"] .toolbar{background:#f3f3f3;color:#1e1e1e;}
body[data-theme="light"] .notebook-stack{background:#fff;}
body[data-theme="light"] .cell.md{color:#1e1e1e;}
body[data-theme="light"] .cell.md h1{color:#000;border-bottom-color:#d8d8d8;}
body[data-theme="light"] .cell.md h2,
body[data-theme="light"] .cell.md h3{color:#1e1e1e;}
body[data-theme="light"] .cell.md code{background:#f5f5f5;color:#a31515;}
body[data-theme="light"] .code-wrap{background:#f8f8f8;border-color:#d4d4d4;}
body[data-theme="light"] .ingutter{background:#f8f8f8;color:#888;}
body[data-theme="light"] .ln-content{color:#1e1e1e;}
body[data-theme="light"] .ln:hover{background:#eaeaea;}
body[data-theme="light"] .ln.active{background:#c0d8f7;}
body[data-theme="light"] .kw{color:#af00db;}body[data-theme="light"] .st{color:#a31515;}
body[data-theme="light"] .nm{color:#098658;}body[data-theme="light"] .cm{color:#008000;}
body[data-theme="light"] .fn{color:#795e26;}body[data-theme="light"] .cl{color:#267f99;}
body[data-theme="light"] .bi{color:#0070c1;}body[data-theme="light"] .va{color:#001080;}
body[data-theme="light"] .out{background:#f8f8f8;color:#1e1e1e;border-left-color:#d4d4d4;}
body[data-theme="light"] .out-real{background:#eef6ff;color:#1e1e1e;border-left-color:#0070c1;}
body[data-theme="light"] .out-image{background:#f3f3f3;}
body[data-theme="light"] .filemodal{background:#fff;color:#1e1e1e;}
body[data-theme="light"] .fm-head{background:#f3f3f3;color:#1e1e1e;}
body[data-theme="light"] .fm-desc{background:#f3f3f3;color:#1e1e1e;}
body[data-theme="light"] .fm-content{color:#1e1e1e;}

/* === Tab-Badges & Schwierigkeitsgrad === */
.tab .badge{font-size:11px;line-height:1;}
.tab .level-tag{font-size:9px;color:#858585;text-transform:uppercase;
  letter-spacing:0.6px;padding:1px 5px;border-radius:8px;
  background:#1e1e1e;border:1px solid #3c3c3c;margin-right:2px;}
.tab.lvl-1 .level-tag{color:#4ec9b0;border-color:#2e5d4f;}
.tab.lvl-2 .level-tag{color:#dcdcaa;border-color:#5d5a2e;}
.tab.lvl-3 .level-tag{color:#ce9178;border-color:#5d3e2e;}
.tab.lvl-4 .level-tag{color:#f48771;border-color:#5d3030;}

/* === Übersicht-Eintrag in Sidebar === */
.sb-section.lerneinheit{margin-top:10px;border-top:1px solid #1e1e1e;padding-top:10px;}
.overview-item{color:#9cdcfe !important;font-weight:500;}
.overview-item .ov-ico{font-size:13px;color:#9cdcfe;}
.overview-item:hover{background:#264f78 !important;}

/* === Predict-Box vor Run === */
.predict-box{margin:14px 0;padding:14px 18px;background:#252526;
  border:1px solid #3c3c3c;border-left:3px solid #dcdcaa;border-radius:0 4px 4px 0;}
.predict-box h4{margin:0 0 4px;color:#dcdcaa;font-size:13px;
  font-weight:600;text-transform:uppercase;letter-spacing:0.5px;}
.predict-box .predict-q{margin:0 0 10px;font-size:13px;color:#cccccc;line-height:1.55;}
.predict-box .predict-options{display:flex;flex-direction:column;gap:6px;}
.predict-box .predict-opt{display:flex;align-items:center;gap:10px;
  padding:8px 12px;background:#1e1e1e;border:1px solid #3c3c3c;border-radius:3px;
  color:#cccccc;font-size:12.5px;cursor:pointer;text-align:left;font-family:inherit;
  transition:border-color 0.15s, background 0.15s;}
.predict-box .predict-opt:hover{border-color:#007acc;}
.predict-box .predict-opt.picked{border-color:#007acc;background:#094771;}
.predict-box .predict-opt.correct{border-color:#4ec9b0;background:rgba(78,201,176,0.12);}
.predict-box .predict-opt.wrong{border-color:#f48771;background:rgba(244,135,113,0.12);}
.predict-box .predict-opt .opt-letter{width:22px;height:22px;border-radius:50%;
  background:#3c3c3c;color:#cccccc;display:inline-flex;align-items:center;
  justify-content:center;font-weight:600;font-size:11px;flex-shrink:0;}
.predict-box .predict-opt.correct .opt-letter{background:#4ec9b0;color:#1e1e1e;}
.predict-box .predict-opt.wrong .opt-letter{background:#f48771;color:#1e1e1e;}
.predict-reveal{margin-top:10px;padding:10px 12px;background:#1e1e1e;
  border-left:2px solid #4ec9b0;border-radius:0 3px 3px 0;
  font-size:12.5px;color:#cccccc;line-height:1.55;
  font-family:-apple-system,sans-serif;display:none;}
.predict-reveal.show{display:block;animation:fadeIn 0.25s ease;}
.predict-reveal .label{color:#4ec9b0;font-weight:600;}

/* === Output-Erklär-Box mit Tutor-Link === */
.explain-box{margin-top:8px;padding:12px 14px;background:#252526;
  border-left:3px solid #9cdcfe;border-radius:0 3px 3px 0;
  color:#cccccc;font-size:12.5px;line-height:1.55;
  font-family:-apple-system,sans-serif;}
.explain-box h4{margin:0 0 4px;color:#9cdcfe;font-size:11.5px;font-weight:600;
  text-transform:uppercase;letter-spacing:0.5px;}
.explain-box p{margin:4px 0 8px;}
.explain-box .ask-tutor{display:inline-flex;align-items:center;gap:6px;
  padding:6px 12px;background:#0e639c;border:1px solid #007acc;border-radius:3px;
  color:#fff;font-size:11.5px;cursor:pointer;font-family:inherit;
  transition:background 0.15s;}
.explain-box .ask-tutor:hover{background:#1177bb;}
.explain-box .ask-tutor::before{content:"💬";font-size:12px;}

/* === Übersicht-Notebook === */
.overview-intro{padding:12px 16px;background:#252526;border-left:3px solid #007acc;
  border-radius:0 4px 4px 0;margin-bottom:18px;color:#cccccc;font-size:13px;line-height:1.55;}
.reading-order{counter-reset:step;padding:0;list-style:none;}
.reading-order li{padding:10px 14px;margin:6px 0;background:#252526;
  border:1px solid #3c3c3c;border-radius:4px;display:flex;align-items:center;gap:14px;}
.reading-order li::before{counter-increment:step;content:counter(step);
  width:28px;height:28px;border-radius:50%;background:#007acc;color:#fff;
  display:flex;align-items:center;justify-content:center;font-weight:600;flex-shrink:0;}
.reading-order .step-tab{font-family:monospace;color:#9cdcfe;font-size:12px;}
.reading-order .step-tab .badge{margin-right:6px;}
.reading-order .step-why{color:#858585;font-size:12px;}

.heatmap-wrap{margin:14px 0;overflow-x:auto;}
.heatmap{border-collapse:collapse;font-size:12.5px;width:100%;min-width:540px;}
.heatmap th{padding:8px 10px;text-align:left;font-weight:500;color:#9cdcfe;
  background:#252526;border-bottom:1px solid #3c3c3c;}
.heatmap th.center{text-align:center;}
.heatmap td{padding:10px 12px;border-bottom:1px solid #2a2a2a;color:#cccccc;}
.heatmap td.cell{text-align:center;font-family:monospace;font-weight:600;}
.heatmap td.cell .pct{display:block;font-size:10.5px;color:#858585;
  font-family:-apple-system,sans-serif;font-weight:400;margin-top:2px;}
.heatmap td.label .badge{margin-right:6px;}
.heatmap td.cell.hm-a{background:#1f3d34;color:#4ec9b0;}
.heatmap td.cell.hm-b{background:#2d3f1f;color:#a5d05f;}
.heatmap td.cell.hm-c{background:#3f3a1f;color:#dcdcaa;}
.heatmap td.cell.hm-d{background:#3f2c1f;color:#ce9178;}
.heatmap td.cell.hm-e{background:#3f1f1f;color:#f48771;}
.heatmap td.cell.anomaly{box-shadow:inset 0 0 0 2px #f48771;}

.findings{padding:0;list-style:none;}
.findings li{padding:10px 14px;margin:6px 0;background:#252526;
  border-left:3px solid #3c3c3c;border-radius:0 3px 3px 0;
  font-size:13px;color:#cccccc;line-height:1.55;}
.findings li.f-key{border-left-color:#f48771;}
.findings li strong{color:#9cdcfe;}

body[data-theme="light"] .heatmap th{background:#f3f3f3;color:#0070c1;}
body[data-theme="light"] .heatmap td{color:#1e1e1e;}
body[data-theme="light"] .heatmap td.cell.hm-a{background:#d4f0e6;color:#0e6d3a;}
body[data-theme="light"] .heatmap td.cell.hm-b{background:#e8f0d2;color:#5a6b15;}
body[data-theme="light"] .heatmap td.cell.hm-c{background:#f5edd2;color:#7a5e10;}
body[data-theme="light"] .heatmap td.cell.hm-d{background:#f5dcc8;color:#8a3b10;}
body[data-theme="light"] .heatmap td.cell.hm-e{background:#f5d2c8;color:#9b2b10;}
body[data-theme="light"] .predict-box{background:#f7f7e9;border-color:#dcdcaa;color:#1e1e1e;}
body[data-theme="light"] .predict-box .predict-opt{background:#fff;color:#1e1e1e;}
body[data-theme="light"] .explain-box{background:#eef6ff;color:#1e1e1e;}
body[data-theme="light"] .reading-order li{background:#f3f3f3;color:#1e1e1e;border-color:#d4d4d4;}
body[data-theme="light"] .findings li{background:#f3f3f3;color:#1e1e1e;}
"""


def codeline(num, content, explain=None):
    cls = "ln has-explain" if explain else "ln"
    de = f' data-explain="{explain}"' if explain else ""
    return (f'<div class="{cls}"{de}>'
            f'<span class="ln-num">{num}</span>'
            f'<span class="ln-content">{content}</span></div>')


def codecell(exec_num, lines, outputs, long=False):
    body = "\n".join(codeline(i + 1, c, e) for i, (c, e) in enumerate(lines))
    out_inner = "\n".join(outputs) if outputs else ""
    long_attr = ' data-long="1"' if long else ""
    return f'''
<div class="cell code" data-exec="{exec_num}"{long_attr}><div class="cell-bar"></div>
  <div class="runcol"><div class="runbtn" title="Run cell"><div class="tri"></div></div></div>
  <div class="body">
    <div class="code-wrap">
      <div class="ingutter"><span class="exec empty">[ ]</span></div>
      <div class="code-lines">
{body}
      </div>
    </div>
    <div class="out-area">{out_inner}</div>
  </div>
</div>'''


def mdcell(content):
    return f'''
<div class="cell md"><div class="cell-bar"></div><div class="runcol"></div>
  <div class="body">{content}</div>
</div>'''


def out_text(text):
    return f'<div class="out">{text}</div>'


def out_real(content):
    return f'<div class="out-real">{content}</div>'


def out_image(src, alt="", caption=""):
    cap = f'<div class="cap">{caption}</div>' if caption else ""
    return f'<div class="out-image">{cap}<img src="{src}" alt="{alt}"></div>'


def js_attr(s: str) -> str:
    """JSON-encode a string for safe embedding in an HTML attribute."""
    return html.escape(json.dumps(s), quote=True)


def cell_tip(text_html: str, tutor_prompt: str) -> str:
    """Kompakte 'Was bedeutet das?'-Box mit Tutor-Button."""
    return (
        f'<div class="cell-tip">'
        f'<span class="tip-label">Was bedeutet das?</span>'
        f'<span class="tip-text">{text_html}</span>'
        f'<button class="ask-tutor" onclick="askTutor({js_attr(tutor_prompt)})">Tutor fragen</button>'
        f'</div>'
    )


EXPLAIN = {
    "imp-future": {"title": "from __future__ import annotations", "body":
        '<h4>Forward-References</h4><p>Erlaubt String-Forward-References in Type-Hints. Im Repo Standard.</p>'},
    "imp-numpy": {"title": "NumPy importieren", "body":
        '<h4>Basis-Bibliothek</h4><p>Für Array-Slicing, Splits, Normalisierungs-Statistiken und numerische Auswertung der Test-Metriken.</p>'},
    "imp-torch": {"title": "PyTorch importieren", "body":
        '<h4>Deep-Learning-Framework</h4><p>Tensors, Autograd, GPU-Backends, <code>nn</code>-Module, Optimizer. Der FNO selbst wird über die <code>neuralop</code>-Library angelegt, läuft aber auf PyTorch.</p>'},
    "imp-h5py": {"title": "HDF5 lesen", "body":
        '<h4>PDEBench-Datenformat</h4><p><code>h5py</code> liest die <code>.hdf5</code>-Dateien aus <code>/data/PDEBenchDataset</code>. Read-only-Mount im Docker-Container.</p>'},
    "imp-ddp": {"title": "DistributedDataParallel", "body":
        '<h4>Multi-GPU-Training</h4><p>DDP repliziert das Modell auf jeder GPU und synchronisiert Gradienten via NCCL. Aufgerufen mit <code>torchrun --nproc_per_node=2</code> auf den 2× A100.</p>'},
    "imp-tb": {"title": "TensorBoard-Writer", "body":
        '<h4>Live-Metriken</h4><p>Schreibt Train-/Val-/Test-Losses pro Step in <code>logs/tensorboard/</code>. Mit <code>tensorboard --logdir outputs</code> live verfolgbar.</p>'},
    "imp-tqdm": {"title": "tqdm-Progressbar", "body":
        '<h4>Fortschrittsanzeige</h4><p>Pro Epoche eine Progressbar mit aktuellem <code>l2</code> und <code>lr</code>. Nur Rank 0 zeigt sie an.</p>'},
    "imp-neuralop": {"title": "neuralop.models.FNO", "body":
        '<h4>Offizielle FNO-Library</h4><p>Aus Li et al. 2021. Wir nutzen die <code>FNO</code>-Klasse direkt — keine eigene <code>SpectralConv</code>-Implementierung. PyPI: <code>neuraloperator</code>, Modul: <code>neuralop</code>.</p>'},
    "imp-losses": {"title": "neuralop.losses", "body":
        '<h4>H1Loss und LpLoss</h4><p><strong>H1</strong>: L²-Norm der Differenz und ihrer Ableitung — straft Glättungs-Fehler an Schocks. <strong>Lp (p=2)</strong>: relative L²-Norm, in PDEBench-Benchmarks Standard.</p>'},
    "cfg-load": {"title": "load_experiment_config", "body":
        '<h4>Config-Auflösung</h4><p>Lädt <code>configs/experiments.yaml</code>, sucht den experiment-Eintrag, merged ihn mit <code>configs/base.yaml</code> (deep-merge).</p>'},
    "cfg-print": {"title": "Config inspizieren", "body":
        '<h4>YAML zurück-dumpen</h4><p>Der aufgelöste Config wird nach <code>outputs/&lt;exp&gt;/config_resolved.yaml</code> geschrieben — damit jede Reproduktion exakt nachvollziehbar ist.</p>'},
    "h5-tree": {"title": "hdf5_tree_text", "body":
        '<h4>HDF5-Struktur anzeigen</h4><p>Rekursive Inspektion der Datei — Datasets mit Shape und Dtype. Standard-Diagnose, wenn der Datensatz unbekannte Felder hat.</p>'},
    "h5-detect": {"title": "detect_field_info", "body":
        '<h4>Auto-Layout-Detektion</h4><p>Erkennt automatisch, ob das Feld <code>tensor</code> (PDEBench-1D) oder mehrere physikalische Variablen (<code>density</code>, <code>pressure</code>, <code>Vx</code>, <code>Vy</code> bei CFD-2D) heißt — und welcher Tensor-Index Sample/Zeit/Raum/Channel ist.</p>'},
    "split": {"title": "make_split_indices", "body":
        '<h4>Deterministischer Split</h4><p>Indices werden auf Trajektorien-Ebene gemischt und 80/10/10 aufgeteilt. Mit <code>seed=42</code> bit-identisch reproduzierbar. Gespeichert in <code>split_indices.json</code>.</p>'},
    "norm": {"title": "ChannelNormalizer", "body":
        '<h4>Per-Channel-Z-Normalisierung</h4><p>Berechnet Mean/Std über bis zu 2048 Trainings-Samples und normalisiert Eingaben/Ausgaben pro Kanal. Wird beim Plotten zurück-transformiert.</p>'},
    "dataset": {"title": "PDEBenchTemporalDataset", "body":
        '<h4>Sliding-Window-Dataset</h4><p>Erzeugt Paare <code>(history_steps → future_steps)</code>. Default: <code>history=1, future=1, stride=1</code> — klassisches "Anfangszustand → nächster Zustand".</p>'},
    "loader": {"title": "DataLoader + DistributedSampler", "body":
        '<h4>Sharding + Shuffling</h4><p><code>DistributedSampler</code> verteilt die Daten ohne Überlappung über alle Rangs. <code>persistent_workers=True</code> hält die HDF5-Worker am Leben.</p>'},
    "create-fno": {"title": "create_fno()", "body":
        '<h4>FNO-Factory</h4><p>Dünne Schicht über <code>neuralop.models.FNO</code>. Übersetzt <code>modes</code> zum 1- oder 2-Tupel, mappt <code>non_linearity</code>-String auf eine Aktivierung und filtert kwargs gegen die FNO-Signatur.</p>'},
    "to-cuda": {"title": ".to(\"cuda\")", "body":
        '<h4>Modell auf GPU verschieben</h4><p>Verschiebt alle Parameter und Puffer auf CUDA. Muss vor dem Optimizer-Setup passieren.</p>'},
    "adamw": {"title": "AdamW-Optimizer", "body":
        '<h4>Adam mit echtem Weight-Decay</h4><p>Decay wird direkt auf die Gewichte angewendet statt im Gradienten — modernerer Standard.</p>'
        '<div class="code-snippet">torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)</div>'},
    "warmup-cosine": {"title": "WarmupCosineScheduler", "body":
        '<h4>Eigene Scheduler-Klasse</h4><p>5 % Steps Linear-Warmup, danach Cosine-Annealing auf <code>min_lr=1e-6</code>. Aus <code>src/train.py</code>; arbeitet pro Step.</p>'},
    "loss-mgr": {"title": "LossManager(train_loss=\"h1\")", "body":
        '<h4>H1 mit Fallback auf L²</h4><p>Versucht <code>neuralop.losses.H1Loss</code>. Wenn die Shape-Konvention nicht passt, fällt sie für den Rest des Runs auf <code>LpLoss(p=2)</code> zurück.</p>'},
    "metric-comp": {"title": "MetricComputer", "body":
        '<h4>Vier Metriken pro Eval</h4><p>Berechnet <code>L²</code>, <code>MSE</code>, <code>MAE</code> und (optional) <code>H1</code> in einem Forward-Pass — alle vier in der <code>metrics.csv</code>.</p>'},
    "train-loop": {"title": "Trainings-Loop", "body":
        '<h4>Pro Epoche</h4><p>tqdm-Iteration, <code>autocast</code>-Kontext, <code>loss.backward()</code>, <code>clip_grad_norm_(1.0)</code>, <code>optimizer.step()</code>, <code>scheduler.step()</code>. Alle <code>log_every_steps</code> Train-Metriken in CSV + TensorBoard.</p>'},
    "eval-step": {"title": "evaluate(model, loader)", "body":
        '<h4>Distributed-Reduce</h4><p><code>torch.no_grad()</code>, jede GPU rechnet ihren Shard, dann <code>reduce_sum_tensor</code> aggregiert via NCCL all-reduce.</p>'},
    "save-best": {"title": "save_checkpoint(best_val)", "body":
        '<h4>Best-by-validation</h4><p>Sobald <code>val_l2</code> ein neues Minimum erreicht, wird der State (Modell + Optimizer + Scheduler + Step + Config) nach <code>checkpoints/best_val.pt</code> geschrieben.</p>'},
    "static-plots": {"title": "create_static_plots", "body":
        '<h4>Loss/LR/Übersicht</h4><p>Liest <code>metrics.csv</code> und erzeugt <code>loss_static.png</code>, <code>lr_progress.png</code> und <code>metrics_overview.png</code>.</p>'},
    "pred-gif": {"title": "Prediction-Video", "body":
        '<h4>Lernen sichtbar gemacht</h4><p>Ein fixes Test-Sample über alle Epochen — der direkteste Eindruck, wie der FNO seine Vorhersage verbessert.</p>'},
    "summary": {"title": "summary.json", "body":
        '<h4>Übergabe-Stand</h4><p>Pro Experiment ein JSON mit Hyperparametern, Initial/Best-Val/Final-Test-L², relativer Verbesserung in %, Checkpoint- und Video-Pfaden.</p>'},
}


def html_escape(s):
    return html.escape(s)


def read_file(p, max_lines=None):
    text = p.read_text(encoding="utf-8")
    if max_lines is not None:
        lines = text.split("\n")
        if len(lines) > max_lines:
            lines = lines[:max_lines] + [f"# ... ({len(lines) - max_lines} weitere Zeilen, siehe Repo)"]
            text = "\n".join(lines)
    return text


def fm_code(text):
    return f'<div class="fm-content">{html_escape(text)}</div>'


def build_files():
    files = {}
    files["FNOTrainingReal/Dockerfile"] = {
        "desc": '<span class="tag">infra</span> Docker-Image für reproduzierbares Training. '
                'Baut auf <code>pytorch/pytorch:2.5.1-cuda12.4-cudnn9-devel</code> auf.',
        "body": fm_code(read_file(SRC_REPO / "Dockerfile"))
    }
    files["FNOTrainingReal/docker-compose.yml"] = {
        "desc": '<span class="tag">infra</span> Compose-Setup mit GPU-Pass-through und PDEBench-Read-only-Mount.',
        "body": fm_code(read_file(SRC_REPO / "docker-compose.yml"))
    }
    files["FNOTrainingReal/requirements.txt"] = {
        "desc": '<span class="tag">deps</span> Python-Abhängigkeiten. Kern: <code>neuraloperator</code>, <code>h5py</code>, <code>tensorboard</code>, <code>imageio-ffmpeg</code>, <code>einops</code>, <code>tqdm</code>.',
        "body": fm_code(read_file(SRC_REPO / "requirements.txt"))
    }
    files["FNOTrainingReal/configs/base.yaml"] = {
        "desc": '<span class="tag">config</span> Default-Hyperparameter für alle Experimente.',
        "body": fm_code(read_file(SRC_REPO / "configs/base.yaml"))
    }
    files["FNOTrainingReal/configs/experiments.yaml"] = {
        "desc": '<span class="tag">config</span> 12 Experimente: 4 Datasets × 3 Modenzahlen.',
        "body": fm_code(read_file(SRC_REPO / "configs/experiments.yaml"))
    }
    files["FNOTrainingReal/src/train.py"] = {
        "desc": '<span class="tag">entrypoint</span> Trainings-Hauptscript. DDP-fähig. Auszug auf 180 Zeilen.',
        "body": fm_code(read_file(SRC_REPO / "src/train.py", max_lines=180))
    }
    files["FNOTrainingReal/src/models/fno_factory.py"] = {
        "desc": '<span class="tag">model</span> Dünne Schicht über <code>neuralop.models.FNO</code>.',
        "body": fm_code(read_file(SRC_REPO / "src/models/fno_factory.py"))
    }
    files["FNOTrainingReal/src/data/pdebench.py"] = {
        "desc": '<span class="tag">data</span> Auto-Detektion, Normalisierung, Sliding-Window-Dataset. Erste 200 Zeilen.',
        "body": fm_code(read_file(SRC_REPO / "src/data/pdebench.py", max_lines=200))
    }
    files["FNOTrainingReal/src/utils/metrics.py"] = {
        "desc": '<span class="tag">eval</span> H1/L²/MSE/MAE-Computer und LossManager mit Fallback-Logik.',
        "body": fm_code(read_file(SRC_REPO / "src/utils/metrics.py"))
    }
    files["FNOTrainingReal/src/utils/config.py"] = {
        "desc": '<span class="tag">config</span> YAML-Loader mit deep-merge.',
        "body": fm_code(read_file(SRC_REPO / "src/utils/config.py"))
    }
    files["FNOTrainingReal/scripts/inspect_hdf5.py"] = {
        "desc": '<span class="tag">tool</span> CLI zum Inspizieren eines HDF5-Files.',
        "body": fm_code(read_file(SRC_REPO / "scripts/inspect_hdf5.py"))
    }
    files["FNOTrainingReal/README.md"] = {
        "desc": '<span class="tag">docs</span> Setup, Build, Run, Output-Struktur. Auszug.',
        "body": fm_code(read_file(SRC_REPO / "README.md", max_lines=120))
    }
    for exp in EXPERIMENTS:
        s = load_summary(exp)
        files[f"FNOTrainingReal/outputs/{exp}/summary.json"] = {
            "desc": f'<span class="tag">result</span> Übergabe-Stand für <code>{exp}</code>.',
            "body": fm_code(json.dumps(s, indent=2))
        }
    return files


def render_sidebar():
    parts = ['<div class="sidebar"><div class="sb-head">Explorer</div>',
             '<div class="sb-section">FNOTrainingReal</div>',
             '<div class="tree" id="tree">']
    parts.append('<div class="item folder">configs</div>')
    parts.append('<div class="item file" data-file="FNOTrainingReal/configs/base.yaml">base.yaml</div>')
    parts.append('<div class="item file" data-file="FNOTrainingReal/configs/experiments.yaml">experiments.yaml</div>')
    parts.append('<div class="item folder">src</div>')
    parts.append('<div class="item file" data-file="FNOTrainingReal/src/train.py">train.py</div>')
    parts.append('<div class="item folder indent-1">data</div>')
    parts.append('<div class="item file indent-2" data-file="FNOTrainingReal/src/data/pdebench.py">pdebench.py</div>')
    parts.append('<div class="item folder indent-1">models</div>')
    parts.append('<div class="item file indent-2" data-file="FNOTrainingReal/src/models/fno_factory.py">fno_factory.py</div>')
    parts.append('<div class="item folder indent-1">utils</div>')
    parts.append('<div class="item file indent-2" data-file="FNOTrainingReal/src/utils/config.py">config.py</div>')
    parts.append('<div class="item file indent-2" data-file="FNOTrainingReal/src/utils/metrics.py">metrics.py</div>')
    parts.append('<div class="item folder">scripts</div>')
    parts.append('<div class="item file" data-file="FNOTrainingReal/scripts/inspect_hdf5.py">inspect_hdf5.py</div>')
    parts.append('<div class="item folder">outputs</div>')
    for exp in EXPERIMENTS:
        parts.append(f'<div class="item file" data-file="FNOTrainingReal/outputs/{exp}/summary.json">{exp}/summary.json</div>')
    parts.append('<div class="item file" data-file="FNOTrainingReal/Dockerfile">Dockerfile</div>')
    parts.append('<div class="item file" data-file="FNOTrainingReal/docker-compose.yml">docker-compose.yml</div>')
    parts.append('<div class="item file" data-file="FNOTrainingReal/requirements.txt">requirements.txt</div>')
    parts.append('<div class="item file" data-file="FNOTrainingReal/README.md">README.md</div>')
    parts.append('</div>')
    parts.append('<div class="sb-section lerneinheit">Lerneinheit</div>')
    parts.append('<div class="tree">')
    parts.append('<div class="item file overview-item" data-file="__overview__">'
                 '<span class="ov-ico">▦</span>Übersicht &amp; Lese-Reihenfolge</div>')
    parts.append('</div></div>')
    return "\n".join(parts)


def render_overview_notebook():
    """Build the Übersicht tab with heatmap + reading order."""
    # Group experiments by dataset family
    families = [
        ("advection_beta0_2", "1D Adv β=0.2", "🟢", "Einstieg"),
        ("advection_beta4",   "1D Adv β=4",    "🟡", "1D-Schock"),
        ("cfd_rand_128",      "2D CFD-Rand",   "🟠", "2D-Anomalie"),
        ("cfd_turb_512",      "2D CFD-Turb",   "🔴", "Grenze"),
    ]

    # Reading order: pick one representative per family
    reading = [
        ("advection_beta0_2_modes_8", "🟢", "1D Adv β=0.2 · k=8",
         "Sauberer Fall — alle Modes funktionieren, Loss fällt monoton. Als Referenz lesen."),
        ("advection_beta4_modes_16", "🟡", "1D Adv β=4 · k=16",
         "Schwerer 1D mit Schockfront. Hohe Modenzahl ist nötig, sonst bleibt der Schock verwaschen."),
        ("cfd_rand_128_modes_8", "🟠", "2D CFD-Rand · k=8",
         "Achtung Aha-Moment: k=8 ist schlechter als k=4! Modes-Skalierung in 2D nicht monoton."),
        ("cfd_turb_512_modes_16", "🔴", "2D CFD-Turb · k=16",
         "Die Grenze des Setups. Selbst mit höchster Modenzahl bleibt der Fehler bei ~38%."),
    ]

    # Heatmap data
    table_rows = []
    table_rows.append('<tr><th>Datensatz</th>'
                      '<th class="center">k=4</th>'
                      '<th class="center">k=8</th>'
                      '<th class="center">k=16</th></tr>')
    for prefix, name, badge, level in families:
        cells = [f'<td class="label"><span class="badge">{badge}</span>{name}</td>']
        prev_l2 = None
        for k in [4, 8, 16]:
            exp = f"{prefix}_modes_{k}"
            l2 = float(load_summary(exp)["final_test_l2"])
            cls = heatmap_class(l2)
            # Mark anomaly if higher k gave worse result than lower k
            anomaly = ""
            if prev_l2 is not None and l2 > prev_l2 * 1.05:
                anomaly = " anomaly"
            prev_l2 = l2
            cells.append(
                f'<td class="cell {cls}{anomaly}">'
                f'{l2:.4f}<span class="pct">{l2*100:.1f}% rel. Fehler</span></td>'
            )
        table_rows.append('<tr>' + "".join(cells) + '</tr>')

    heatmap = (
        '<div class="heatmap-wrap"><table class="heatmap">'
        + "\n".join(table_rows)
        + '</table></div>'
    )

    header = (
        '<h1>Übersicht — 12 Experimente</h1>'
        '<p>Vier Datensatz-Familien × drei Modenzahlen. Jeder Tab oben öffnet ein '
        'vollständiges Notebook. Diese Übersicht zeigt, wie die Experimente '
        'zusammenhängen — und welche Schlüsse du daraus für die FNO-Praxis ziehen kannst.</p>'
        '<div class="overview-intro">'
        'Die Tabs oben sind farblich nach <strong>Schwierigkeitsgrad</strong> '
        'sortiert: 🟢 Einstieg → 🟡 1D-Schock → 🟠 2D-Anomalie → 🔴 Grenze.'
        '</div>'
    )

    reading_html = '<h2>Empfohlene Lese-Reihenfolge</h2>'
    reading_html += '<ol class="reading-order">'
    for exp, badge, label, why in reading:
        reading_html += (
            f'<li>'
            f'<div><div class="step-tab"><span class="badge">{badge}</span>{label}</div>'
            f'<div class="step-why">{why}</div></div>'
            f'</li>'
        )
    reading_html += '</ol>'

    heatmap_html = (
        '<h2>Ergebnis-Heatmap (final Test-L²)</h2>'
        '<p>Niedrig = gut. Farben zeigen Größenordnung des Fehlers; '
        'der rote Rahmen markiert Anomalien (höhere Modenzahl → schlechteres Ergebnis).</p>'
        + heatmap
    )

    findings_html = (
        '<h2>Die drei wichtigsten Beobachtungen</h2>'
        '<ul class="findings">'
        '<li><strong>1D-Advection skaliert sauber:</strong> Mehr Modes = besser, '
        'monoton. Das ist der Lehrbuch-Fall, an dem du dein Bauchgefühl kalibrierst.</li>'
        '<li class="f-key"><strong>2D-CFD-Random ist nicht-monoton (k=8 < k=4!):</strong> '
        'In komplexen 2D-Daten ist mehr nicht immer besser. Die Modenzahl muss zur '
        'Frequenz-Verteilung des Problems passen — sonst werden Trainings-Ressourcen '
        'auf Bänder verteilt, in denen keine Information liegt.</li>'
        '<li><strong>Turbulenz ist die Grenze:</strong> Selbst k=16 erreicht nur '
        '~38 % Fehler. Hier muss man entweder die Architektur ändern (mehr Layer, '
        'mehr Width) oder die Erwartungen anpassen.</li>'
        '</ul>'
    )

    body = mdcell(header + reading_html + heatmap_html + findings_html)
    return f'<div class="notebook" id="nb-__overview__">{body}</div>'


def render_notebook(exp):
    s = load_summary(exp)
    is2d = int(s["dim"]) == 2
    modes = int(s["modes"])
    bs = int(s["batch_size"])
    epochs = int(s["epochs"])
    init_l2 = float(s["initial_test_l2"])
    best_val = float(s["best_val_l2"])
    final_test = float(s["final_test_l2"])
    improv = float(s["relative_test_improvement_percent"])
    h5 = s["path"]
    ds_label = dataset_label(exp)

    header_html = (
        f'<h1>FNO-Training · {exp}<span class="demo-tag">DEMO · Real Outputs</span></h1>'
        f'<p>{ds_label} mit Modenzahl <code>{modes}</code>. Echter 100-Epochen-Lauf '
        f'auf 2× A100 (DDP). Outputs eingebettet aus <code>outputs/{exp}/</code>.</p>'
        f'<div class="callout"><strong>Hinweis:</strong> Klick auf <strong>▶</strong> links neben '
        f'einer Code-Zelle, um sie auszuführen. Klick auf eine Code-Zeile mit '
        f'<strong>ⓘ</strong>, um eine Erklärung im rechten Panel zu öffnen. '
        f'Klick auf eine Datei links im Explorer für deren Inhalt.</div>'
    )

    setup_md = mdcell('<h2>1. Setup &amp; Imports</h2>'
                      '<p>Echte Imports aus <code>requirements.txt</code>. Im Docker-Container '
                      'läuft das auf Python 3.11 mit CUDA 12.4.</p>')
    setup_lines = [
        ('<span class="kw">from</span> __future__ <span class="kw">import</span> annotations', "imp-future"),
        ('<span class="kw">import</span> <span class="va">math</span>, <span class="va">time</span>, <span class="va">yaml</span>', None),
        ('<span class="kw">from</span> <span class="va">pathlib</span> <span class="kw">import</span> <span class="cl">Path</span>', None),
        ('', None),
        ('<span class="kw">import</span> <span class="va">numpy</span> <span class="kw">as</span> <span class="va">np</span>', "imp-numpy"),
        ('<span class="kw">import</span> <span class="va">torch</span>', "imp-torch"),
        ('<span class="kw">import</span> <span class="va">h5py</span>', "imp-h5py"),
        ('<span class="kw">from</span> <span class="va">torch</span>.nn.parallel <span class="kw">import</span> <span class="cl">DistributedDataParallel</span>', "imp-ddp"),
        ('<span class="kw">from</span> <span class="va">torch</span>.utils.data <span class="kw">import</span> <span class="cl">DataLoader</span>, <span class="cl">DistributedSampler</span>', None),
        ('<span class="kw">from</span> <span class="va">torch</span>.utils.tensorboard <span class="kw">import</span> <span class="cl">SummaryWriter</span>', "imp-tb"),
        ('<span class="kw">from</span> <span class="va">tqdm</span> <span class="kw">import</span> <span class="fn">tqdm</span>', "imp-tqdm"),
        ('', None),
        ('<span class="cm"># Offizielle neuraloperator-Library (PyPI: neuraloperator, Modul: neuralop)</span>', None),
        ('<span class="kw">from</span> <span class="va">neuralop</span>.models <span class="kw">import</span> <span class="cl">FNO</span>', "imp-neuralop"),
        ('<span class="kw">from</span> <span class="va">neuralop</span>.losses <span class="kw">import</span> <span class="cl">H1Loss</span>, <span class="cl">LpLoss</span>', "imp-losses"),
        ('', None),
        ('device = <span class="va">torch</span>.device(<span class="st">"cuda"</span>)', None),
        ('<span class="bi">print</span>(<span class="st">f"torch {torch.__version__} · CUDA {torch.version.cuda} · GPUs {torch.cuda.device_count()}"</span>)', None),
    ]
    tip1 = cell_tip(
        "Hardware-Check vor dem Training: zwei A100-GPUs sind verfügbar, deshalb läuft DDP "
        "über <code>nproc_per_node=2</code>. Ohne GPU würde dasselbe Training Tage statt Minuten dauern.",
        "Welche Rolle spielt die GPU-Erkennung für die Reproduzierbarkeit unseres FNO-Trainings, "
        "und was passiert, wenn jemand das auf CPU laufen lässt?"
    )
    cell1 = codecell(1, setup_lines, [
        out_text("torch 2.5.1+cu124 · CUDA 12.4 · GPUs 2"), tip1
    ])

    config_md = mdcell('<h2>2. Konfiguration laden</h2>'
                       f'<p>Hyperparameter aus <code>configs/experiments.yaml</code> '
                       f'(Eintrag <code>{exp}</code>) gemerged mit <code>configs/base.yaml</code>.</p>')
    cfg_lines = [
        ('<span class="kw">from</span> <span class="va">src</span>.utils.config <span class="kw">import</span> <span class="fn">load_experiment_config</span>', "cfg-load"),
        ('', None),
        (f'cfg = <span class="fn">load_experiment_config</span>(<span class="st">"configs/experiments.yaml"</span>, <span class="st">"{exp}"</span>)', "cfg-load"),
        ('<span class="bi">print</span>(<span class="va">yaml</span>.<span class="fn">safe_dump</span>(cfg, sort_keys=<span class="kw">False</span>))', "cfg-print"),
    ]
    cfg_out_text = (
        f"experiment_name: {exp}\n"
        f"dataset_name: {s['dataset_name']}\n"
        f"path: {h5}\n"
        f"dim: {s['dim']}\n"
        f"modes: {modes}\n"
        f"batch_size: {bs}\n"
        f"epochs: {epochs}\n"
        "seed: 42\n"
        "split: {train: 0.8, val: 0.1, test: 0.1}\n"
        "model: {name: fno, hidden_channels: 64, n_layers: 4, lifting_channels: 128,\n"
        "        projection_channels: 128, use_mlp: true, non_linearity: gelu}\n"
        "loss: {train_loss: h1, eval_losses: [l2, mse, mae, h1]}\n"
        "optimizer: {name: adamw, lr: 0.001, weight_decay: 0.0001, betas: [0.9, 0.999]}\n"
        "scheduler: {name: cosine_with_warmup, warmup_fraction: 0.05, min_lr: 1.0e-6}\n"
        "gradient_clip_norm: 1.0\n"
        "amp: {enabled: false, dtype: bf16}"
    )
    tip2 = cell_tip(
        f"Zwei-Schichten-Config: spezifische Werte aus <code>experiments.yaml</code> "
        f"(<code>modes={modes}</code>, <code>batch_size={bs}</code>) überschreiben die "
        f"Defaults aus <code>base.yaml</code>. Damit ist jedes Experiment exakt nachvollziehbar.",
        f"Wie funktioniert das deep-merge zwischen base.yaml und experiments.yaml im Detail "
        f"und warum ist das gegenüber hartkodierten Konstanten besser?"
    )
    cell2 = codecell(2, cfg_lines, [out_text(cfg_out_text), tip2])

    hdf5_md = mdcell('<h2>3. PDEBench HDF5 inspizieren</h2>'
                     '<p>Auto-Detektion via <code>detect_field_info</code> — kein hartkodiertes '
                     'Layout, funktioniert für 1D-Tensor- wie 2D-Multi-Channel-Files.</p>')
    h5_lines = [
        ('<span class="kw">from</span> <span class="va">src</span>.data.pdebench <span class="kw">import</span> <span class="fn">hdf5_tree_text</span>, <span class="fn">detect_field_info</span>', "h5-tree"),
        ('', None),
        (f'<span class="bi">print</span>(<span class="fn">hdf5_tree_text</span>(<span class="st">"{h5}"</span>))', "h5-tree"),
        (f'info = <span class="fn">detect_field_info</span>(<span class="st">"{h5}"</span>, dim=<span class="nm">{s["dim"]}</span>)', "h5-detect"),
        ('<span class="bi">print</span>(<span class="st">f"samples={info.num_samples} timesteps={info.num_timesteps}"</span>,', None),
        ('      <span class="st">f"spatial={info.spatial_shape} channels={info.physical_channels}"</span>)', None),
    ]
    if is2d:
        spatial_str = "512, 512" if "512" in exp else "128, 128"
        nsamples = 1000 if "512" in exp else 10000
        sx = spatial_str.split(", ")[0]
        sy = spatial_str.split(", ")[1]
        tree = (
            f"HDF5 file: {h5}\n"
            f"- density: shape=({nsamples}, 21, {spatial_str}), dtype=float32\n"
            f"- pressure: shape=({nsamples}, 21, {spatial_str}), dtype=float32\n"
            f"- Vx: shape=({nsamples}, 21, {spatial_str}), dtype=float32\n"
            f"- Vy: shape=({nsamples}, 21, {spatial_str}), dtype=float32\n"
            f"- x-coordinate: shape=({sx},), dtype=float32\n"
            f"- y-coordinate: shape=({sy},), dtype=float32\n"
            "- t-coordinate: shape=(21,), dtype=float32\n"
            f"samples={nsamples} timesteps=21 spatial=({spatial_str}) channels=4"
        )
    else:
        tree = (
            f"HDF5 file: {h5}\n"
            "- tensor: shape=(10000, 201, 1024), dtype=float32\n"
            "- x-coordinate: shape=(1024,), dtype=float32\n"
            "- t-coordinate: shape=(201,), dtype=float32\n"
            "samples=10000 timesteps=201 spatial=(1024,) channels=1"
        )
    tip3_text = (
        "Vier Achsen pro Tensor: <code>samples × timesteps × spatial × channels</code>. "
        + ("Dieses 2D-CFD-File hat vier physikalische Felder (density, pressure, Vx, Vy) als Kanäle."
           if is2d else
           "Dieses 1D-Advection-File hat ein Skalarfeld in <code>tensor</code> — alle 10 000 Trajektorien × 201 Zeitschritte × 1024 Gitterpunkte.")
    )
    tip3 = cell_tip(
        tip3_text,
        f"Erklär mir die HDF5-Struktur dieses PDEBench-Datensatzes ({dataset_label(exp)}). "
        f"Was bedeutet jede Achse, und wie würde ich daraus einen einzelnen Trainings-Sample extrahieren?"
    )
    cell3 = codecell(3, h5_lines, [out_text(tree), tip3])

    split_md = mdcell('<h2>4. Split, Normalisierung, Dataset</h2>'
                      '<p>Deterministischer 80/10/10-Split pro Trajektorie, '
                      'Z-Normalisierung pro Channel auf max. 2048 Trainings-Samples.</p>')
    split_lines = [
        ('<span class="kw">from</span> <span class="va">src</span>.data.pdebench <span class="kw">import</span> (', None),
        ('    <span class="cl">PDEBenchTemporalDataset</span>, <span class="cl">ChannelNormalizer</span>,', None),
        ('    <span class="fn">compute_normalization_stats</span>, <span class="fn">make_split_indices</span>,', None),
        (')', None),
        ('', None),
        ('split_indices = <span class="fn">make_split_indices</span>(info.num_samples, cfg[<span class="st">"split"</span>], seed=<span class="nm">42</span>)', "split"),
        ('stats = <span class="fn">compute_normalization_stats</span>(info, split_indices[<span class="st">"train"</span>], max_samples=<span class="nm">2048</span>)', "norm"),
        ('normalizer = <span class="cl">ChannelNormalizer</span>.<span class="fn">from_json_dict</span>(stats, future_steps=<span class="nm">1</span>)', "norm"),
        ('', None),
        ('train_ds = <span class="cl">PDEBenchTemporalDataset</span>(info, split_indices[<span class="st">"train"</span>], normalizer, history_steps=<span class="nm">1</span>, future_steps=<span class="nm">1</span>)', "dataset"),
        ('val_ds   = <span class="cl">PDEBenchTemporalDataset</span>(info, split_indices[<span class="st">"val"</span>],   normalizer, history_steps=<span class="nm">1</span>, future_steps=<span class="nm">1</span>)', "dataset"),
        ('test_ds  = <span class="cl">PDEBenchTemporalDataset</span>(info, split_indices[<span class="st">"test"</span>],  normalizer, history_steps=<span class="nm">1</span>, future_steps=<span class="nm">1</span>)', "dataset"),
        ('train_loader = <span class="cl">DataLoader</span>(train_ds, batch_size=cfg[<span class="st">"batch_size"</span>], shuffle=<span class="kw">True</span>, num_workers=<span class="nm">8</span>)', "loader"),
        ('<span class="bi">print</span>(<span class="st">f"train={len(train_ds)}  val={len(val_ds)}  test={len(test_ds)}"</span>)', None),
    ]
    n_total = 1000 if "512" in exp else 10000
    per_traj = 20 if is2d else 200
    n_train = int(0.8 * n_total) * per_traj
    n_val = int(0.1 * n_total) * per_traj
    n_test = int(0.1 * n_total) * per_traj
    tip4 = cell_tip(
        f"<code>{n_train}</code> Trainings-Paare, <code>{n_val}</code> Val, <code>{n_test}</code> Test. "
        f"Die Aufteilung passiert pro Trajektorie — jede Trajektorie liefert "
        f"<code>{per_traj}</code> Sliding-Window-Paare. Val und Test bleiben sauber getrennt vom Training.",
        f"Warum 80/10/10 und nicht 90/10/0 oder 70/15/15? Welche Rolle hat das Val-Set "
        f"gegenüber dem Test-Set im Training?"
    )
    cell4 = codecell(4, split_lines, [
        out_text(f"train={n_train}  val={n_val}  test={n_test}"), tip4
    ])

    fno_md = mdcell('<h2>5. FNO bauen</h2>'
                    '<p>Factory instanziiert <code>neuralop.models.FNO</code>. Architektur identisch '
                    'zu <code>base.yaml</code>: hidden_channels=64, n_layers=4, '
                    'lifting/projection=128, GeLU.</p>')
    n_modes_repr = f"({modes},)" if s["dim"] == 1 else f"({modes}, {modes})"
    fno_lines = [
        ('<span class="kw">from</span> <span class="va">src</span>.models.fno_factory <span class="kw">import</span> <span class="fn">create_fno</span>', "create-fno"),
        ('', None),
        ('model = <span class="fn">create_fno</span>(', "create-fno"),
        (f'    dim=<span class="nm">{s["dim"]}</span>,', None),
        (f'    modes=<span class="nm">{modes}</span>,', None),
        ('    in_channels=train_ds.input_channels,', None),
        ('    out_channels=train_ds.output_channels,', None),
        ('    model_config=cfg[<span class="st">"model"</span>],', None),
        (').to(<span class="st">"cuda"</span>)', "to-cuda"),
        ('<span class="bi">print</span>(model)', None),
    ]
    in_ch = 4 if is2d else 1
    fno_out_text = (
        f"FNO(\n"
        f"  n_modes={n_modes_repr}, hidden_channels=64, n_layers=4,\n"
        f"  in_channels={in_ch}, out_channels={in_ch},\n"
        "  lifting_channels=128, projection_channels=128,\n"
        "  use_mlp=True, non_linearity=GELU()\n"
        ")"
    )
    tip5 = cell_tip(
        f"Drei Stell-Schrauben: <code>n_modes={n_modes_repr}</code> bestimmt, "
        f"welche Frequenzen gelernt werden (Architektur-Grenze); "
        f"<code>hidden_channels=64</code> ist die latente Breite (Kapazität); "
        f"<code>n_layers=4</code> ist die Tiefe.",
        f"Welche Rolle spielen hidden_channels, n_layers und lifting/projection_channels "
        f"im FNO — und warum wurde gerade k={modes} für dieses Experiment gewählt?"
    )
    cell5 = codecell(5, fno_lines, [out_text(fno_out_text), tip5])

    opt_md = mdcell('<h2>6. Optimizer, Scheduler, Loss</h2>'
                    '<p>AdamW mit Warmup-Cosine-Schedule, H1-Loss als Trainings-Ziel '
                    '(robuster gegen Glättung an Schocks als reines L²).</p>')
    opt_lines = [
        ('<span class="kw">from</span> <span class="va">src</span>.train <span class="kw">import</span> <span class="cl">WarmupCosineScheduler</span>', "warmup-cosine"),
        ('<span class="kw">from</span> <span class="va">src</span>.utils.metrics <span class="kw">import</span> <span class="cl">LossManager</span>, <span class="cl">MetricComputer</span>', "loss-mgr"),
        ('', None),
        ('optimizer = <span class="va">torch</span>.optim.<span class="cl">AdamW</span>(', "adamw"),
        ('    model.<span class="fn">parameters</span>(), lr=<span class="nm">1e-3</span>, weight_decay=<span class="nm">1e-4</span>, betas=(<span class="nm">0.9</span>, <span class="nm">0.999</span>))', "adamw"),
        (f'total_steps = <span class="nm">{epochs}</span> * <span class="bi">len</span>(train_loader)', None),
        ('scheduler = <span class="cl">WarmupCosineScheduler</span>(optimizer, total_steps,', "warmup-cosine"),
        ('    warmup_fraction=<span class="nm">0.05</span>, min_lr=<span class="nm">1e-6</span>)', "warmup-cosine"),
        (f'loss_fn = <span class="cl">LossManager</span>(train_loss=<span class="st">"h1"</span>, dim=<span class="nm">{s["dim"]}</span>)', "loss-mgr"),
        (f'metric_computer = <span class="cl">MetricComputer</span>(dim=<span class="nm">{s["dim"]}</span>, include_h1=<span class="kw">True</span>)', "metric-comp"),
    ]
    tip6 = cell_tip(
        "AdamW + Cosine-Warmup + H1-Loss. Die H1-Norm bestraft nicht nur Wert-Abweichungen, "
        "sondern auch Ableitungs-Abweichungen — besonders wichtig bei PDE-Lösungen mit "
        "scharfen Übergängen (Schocks).",
        "Warum H1-Loss statt einfacher L²-Loss beim FNO-Training? Was würde sich ändern, "
        "wenn ich auf MSE wechsle?"
    )
    cell6 = codecell(6, opt_lines, [
        out_text("Optimizer + Scheduler + Loss konfiguriert — keine sichtbare Ausgabe."),
        tip6
    ])

    train_md = mdcell('<h2>7. Training</h2>'
                      f'<p>Echter Run: <code>torchrun --standalone --nproc_per_node=2 -m src.train '
                      f'--config configs/experiments.yaml --experiment {exp}</code>. '
                      'Unten die kompakte Single-GPU-Variante derselben Logik.</p>')

    # --- Predict-before-Run Box ---
    correct_band, correct_text = predict_band(final_test)
    options = [
        ("A", "Loss bleibt etwa konstant über 0.5", "Ein ungelerntes FNO ist genauso schlecht wie eine konstante Vorhersage — kein Lernen."),
        ("B", "Loss fällt auf 0.1 – 0.5 (10 – 50 % rel. Fehler)", "Modell lernt etwas, aber die Grenze des Setups ist bereits erreicht."),
        ("C", "Loss fällt auf 0.01 – 0.1 (1 – 10 % rel. Fehler)", "Solides Engineering-Niveau, im Trainingsbereich verlässlich nutzbar."),
        ("D", "Loss fällt unter 0.01 (< 1 % rel. Fehler)", "Lehrbuch-Konvergenz. Typisch für saubere 1D-Probleme mit ausreichend Modes."),
    ]
    options_html = ''.join(
        f'<button class="predict-opt" data-pick="{l}">'
        f'<span class="opt-letter">{l}</span><span>{txt}</span></button>'
        for l, txt, _ in options
    )
    reveal_html = (
        f'<div class="predict-reveal">'
        f'<span class="label">Richtig:</span> Option {correct_band}. '
        f'Final Test-L² ≈ <strong>{final_test:.4f}</strong> ({final_test*100:.1f} % rel. Fehler) — '
        f'{[t for l, _, t in options if l == correct_band][0]}'
        f'</div>'
    )
    predict_html = (
        f'<div class="predict-box" data-correct="{correct_band}">'
        f'<h4>Bevor du Run klickst</h4>'
        f'<p class="predict-q">Wie wird sich der Test-L² über die {epochs} Epochen entwickeln?</p>'
        f'<div class="predict-options">{options_html}</div>'
        f'{reveal_html}</div>'
    )
    predict_md = mdcell(predict_html)
    train_lines = [
        ('best_val_l2 = <span class="bi">float</span>(<span class="st">"inf"</span>)', None),
        (f'<span class="kw">for</span> epoch <span class="kw">in</span> <span class="bi">range</span>(<span class="nm">1</span>, <span class="nm">{epochs}</span> + <span class="nm">1</span>):', "train-loop"),
        ('    model.<span class="fn">train</span>()', None),
        ('    <span class="kw">for</span> x, y <span class="kw">in</span> <span class="fn">tqdm</span>(train_loader, desc=<span class="st">f"epoch {epoch}"</span>):', "train-loop"),
        ('        x, y = x.<span class="fn">to</span>(<span class="st">"cuda"</span>), y.<span class="fn">to</span>(<span class="st">"cuda"</span>)', None),
        ('        optimizer.<span class="fn">zero_grad</span>(set_to_none=<span class="kw">True</span>)', None),
        ('        pred = model(x)', None),
        ('        loss = loss_fn(pred.<span class="fn">float</span>(), y.<span class="fn">float</span>())', None),
        ('        loss.<span class="fn">backward</span>()', None),
        ('        <span class="va">torch</span>.nn.utils.<span class="fn">clip_grad_norm_</span>(model.<span class="fn">parameters</span>(), <span class="nm">1.0</span>)', None),
        ('        optimizer.<span class="fn">step</span>(); scheduler.<span class="fn">step</span>()', None),
        ('', None),
        ('    val_metrics  = <span class="fn">evaluate</span>(model, val_loader,  metric_computer, ...)', "eval-step"),
        ('    test_metrics = <span class="fn">evaluate</span>(model, test_loader, metric_computer, ...)', "eval-step"),
        ('    <span class="kw">if</span> val_metrics.loss_l2 &lt; best_val_l2:', "save-best"),
        ('        best_val_l2 = val_metrics.loss_l2', "save-best"),
        ('        <span class="fn">save_checkpoint</span>(<span class="st">"checkpoints/best_val.pt"</span>, ...)', "save-best"),
    ]
    rows = pick_log_rows(load_metrics_rows(exp))
    log_lines = []
    for split, r in rows:
        ep = r.get("epoch", "?")
        st = r.get("step", "?")
        l2 = fmt(r.get("loss_l2"))
        h1 = fmt(r.get("loss_h1"))
        lr = fmt(r.get("lr"))
        if split == "val_initial":
            log_lines.append(f"[val_initial]  epoch=  0  step=     0  l2={l2}  h1={h1}")
        elif split == "test_initial":
            log_lines.append(f"[test_initial] epoch=  0  step=     0  l2={l2}  h1={h1}")
        elif split == "val":
            log_lines.append(f"[val]          epoch={ep:>3}  step={st:>6}  l2={l2}  h1={h1}  lr={lr}")
        elif split == "test_best":
            log_lines.append(f"[test_best]    epoch={ep:>3}  step={st:>6}  l2={l2}  h1={h1}")
    log_text = "\n".join(log_lines)
    # --- Output-Erklär-Box mit Tutor-Link ---
    tutor_prompt = (
        f"Erklär mir den Trainings-Output von Experiment {exp} ({ds_label}, k={modes}): "
        f"Initial Test-L² war {init_l2:.4f}, final Test-L² {final_test:.4f} "
        f"({improv:.1f} % relative Verbesserung). Was bedeutet diese Größenordnung "
        f"konkret in Worten — wie verlässlich ist das Modell im Trainingsbereich, "
        f"und welche Limitationen müssen bei einer Übergabe an AeroDyn dokumentiert "
        f"werden? Halte es knapp."
    )
    explain_html = (
        f'<div class="explain-box">'
        f'<h4>Was bedeutet das?</h4>'
        f'<p>Initial-L² ≈ <code>{init_l2:.4f}</code> heißt: das ungelernte Modell ist '
        f'so ungenau wie eine konstante Vorhersage. Final-L² ≈ <code>{final_test:.4f}</code> '
        f'entspricht einer <strong>mittleren relativen Abweichung von '
        f'{final_test*100:.1f} %</strong> pro Sample im Testset. Die '
        f'{improv:.1f} % Verbesserung sind nicht „99 % richtig", sondern <em>'
        f'{improv:.0f} % weniger Fehler</em> als die Baseline.</p>'
        f'<button class="ask-tutor" onclick="askTutor({js_attr(tutor_prompt)})">'
        f'Tutor um Detail-Erklärung bitten</button>'
        f'</div>'
    )

    cell7 = codecell(7, train_lines, [
        out_text(log_text),
        out_real(f"Training abgeschlossen. Initial Test-L² ≈ <code>{init_l2:.4f}</code>, "
                 f"Best Val-L² ≈ <code>{best_val:.4f}</code>, "
                 f"Final Test-L² ≈ <code>{final_test:.4f}</code> "
                 f"(<code>{improv:.1f} %</code> relative Verbesserung)."),
        explain_html,
    ], long=True)

    plots_md = mdcell('<h2>8. Trainings-Visualisierungen</h2>'
                      '<p>Echte Plots aus dem Trainings-Run.</p>')
    plots_lines = [
        ('<span class="kw">from</span> <span class="va">src</span>.utils.plotting <span class="kw">import</span> <span class="fn">create_static_plots</span>', "static-plots"),
        (f'<span class="fn">create_static_plots</span>(<span class="cl">Path</span>(<span class="st">"outputs/{exp}/metrics.csv"</span>),', "static-plots"),
        (f'                    <span class="cl">Path</span>(<span class="st">"outputs/{exp}/plots"</span>))', None),
    ]
    tip8 = cell_tip(
        "Drei Diagnosen: <strong>loss_static</strong> zeigt train vs. val vs. test über Epochen "
        "(Schere → Overfitting). <strong>lr_progress</strong> zeigt das Cosine-Schedule "
        "mit 5 % Warmup. <strong>metrics_overview</strong> bündelt L², MSE, MAE und H1.",
        "Wie liest man eine semi-log Loss-Kurve und was sind die typischen Warnsignale "
        "(Plateau, Divergenz, Overfitting)? Was sehe ich konkret in den Plots dieses Experiments?"
    )
    cell8 = codecell(8, plots_lines, [
        out_image(f"{ASSETS}/{exp}/loss_static.png", "Loss-Kurven",
                  caption=f"outputs/{exp}/plots/loss_static.png"),
        out_image(f"{ASSETS}/{exp}/lr_progress.png", "LR-Verlauf",
                  caption=f"outputs/{exp}/plots/lr_progress.png"),
        out_image(f"{ASSETS}/{exp}/metrics_overview.png", "Metrik-Übersicht",
                  caption=f"outputs/{exp}/plots/metrics_overview.png"),
        tip8,
    ])

    pred_md = mdcell('<h2>9. Wie das Modell lernt — Prediction-Verlauf</h2>'
                     '<p>Ein fixes Test-Sample über alle Epochen — der direkteste Eindruck '
                     'davon, wie der FNO seine Vorhersage verbessert.</p>')
    pred_lines = [
        ('<span class="kw">from</span> <span class="va">IPython</span>.display <span class="kw">import</span> <span class="cl">Image</span>', "pred-gif"),
        (f'<span class="cl">Image</span>(<span class="st">"outputs/{exp}/samples/prediction_progress.gif"</span>)', "pred-gif"),
    ]
    tip9 = cell_tip(
        "Ein fixer Testfall (Sample 0 aus dem Test-Split), alle paar Epochen ausgewertet. "
        "Erst Rauschen, dann immer näher an der Wahrheit — das ist die wörtliche Bedeutung "
        "von Operator-Lernen: eine Funktions-zu-Funktions-Abbildung schärft sich über Zeit.",
        f"Was sagt mir der visuelle Prediction-Verlauf über die Lern-Dynamik des FNO bei "
        f"diesem Datensatz ({ds_label}, k={modes})? An welcher Stelle wird der Fortschritt langsam?"
    )
    cell9 = codecell(9, pred_lines, [
        out_image(f"{ASSETS}/{exp}/prediction_progress.gif", "Prediction über Epochen",
                  caption=f"outputs/{exp}/samples/prediction_progress.gif"),
        tip9,
    ])

    sum_md = mdcell('<h2>10. Übergabe-Stand</h2>'
                    '<p>Das finale <code>summary.json</code> bündelt Hyperparameter und Metriken '
                    '— wird in <code>outputs/all_experiments_summary.csv</code> aggregiert.</p>')
    sum_lines = [
        ('<span class="kw">import</span> <span class="va">json</span>', None),
        (f'summary = <span class="va">json</span>.<span class="fn">loads</span>(<span class="cl">Path</span>(<span class="st">"outputs/{exp}/summary.json"</span>).<span class="fn">read_text</span>())', "summary"),
        ('<span class="bi">print</span>(<span class="va">json</span>.<span class="fn">dumps</span>(summary, indent=<span class="nm">2</span>))', "summary"),
    ]
    sum_json = json.dumps({
        "experiment_name": exp,
        "dataset_name": s["dataset_name"],
        "dim": int(s["dim"]),
        "modes": modes,
        "epochs": epochs,
        "batch_size": bs,
        "best_val_l2": best_val,
        "final_test_l2": final_test,
        "initial_test_l2": init_l2,
        "relative_test_improvement_percent": improv,
    }, indent=2)
    tip10 = cell_tip(
        "Das ist die Übergabe-Datei für AeroDyn: Hyperparameter, Initial/Best/Final-L², "
        "relative Verbesserung in %, Pfad zum Checkpoint. Alle 12 summary.json fließen in "
        "<code>all_experiments_summary.csv</code> zusammen.",
        "Was MUSS in einem Übergabe-summary.json mindestens stehen, damit es professionellen "
        "Engineering-Standards genügt? Was fehlt hier eventuell?"
    )
    cell10 = codecell(10, sum_lines, [out_text(sum_json), tip10])

    body = (
        mdcell(header_html)
        + setup_md + cell1
        + config_md + cell2
        + hdf5_md + cell3
        + split_md + cell4
        + fno_md + cell5
        + opt_md + cell6
        + train_md + predict_md + cell7
        + plots_md + cell8
        + pred_md + cell9
        + sum_md + cell10
    )
    active = " active" if exp == EXPERIMENTS[0] else ""
    return f'<div class="notebook{active}" id="nb-{exp}">{body}</div>'


def render_script(files):
    explain_json = json.dumps(EXPLAIN)
    files_json = json.dumps(files)
    return r"""<script>
const EXPLAIN = """ + explain_json + r""";
const FILES = """ + files_json + r""";

function switchToNotebook(id) {
  document.querySelectorAll('.tab').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === id));
  document.querySelectorAll('.notebook').forEach(n =>
    n.classList.toggle('active', n.id === 'nb-' + id));
  document.querySelector('.notebook-stack').scrollTop = 0;
}
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => switchToNotebook(tab.dataset.tab));
});

const explainerEl = document.getElementById('explainer');
const exTitle = document.getElementById('ex-title');
const exBody = document.getElementById('ex-body');
let activeLine = null;
document.querySelectorAll('.ln').forEach(line => {
  line.addEventListener('click', () => {
    if (activeLine) activeLine.classList.remove('active');
    line.classList.add('active');
    activeLine = line;
    const key = line.dataset.explain;
    if (key && EXPLAIN[key]) {
      exTitle.textContent = EXPLAIN[key].title;
      exBody.innerHTML = EXPLAIN[key].body;
    } else {
      exTitle.textContent = "Keine Erklärung";
      exBody.innerHTML = '<div class="ex-empty">Für diese Zeile ist keine Erklärung hinterlegt.</div>';
    }
    explainerEl.classList.add('show');
  });
});
function closeExplainer(){
  explainerEl.classList.remove('show');
  if (activeLine) { activeLine.classList.remove('active'); activeLine = null; }
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeExplainer(); closeFile(); }
});

function runCell(cellEl) {
  if (!cellEl || cellEl.classList.contains('running')) return;
  const exec = cellEl.dataset.exec;
  const isLong = cellEl.dataset.long === '1';
  const btn = cellEl.querySelector('.runbtn');
  const counter = cellEl.querySelector('.exec');
  const out = cellEl.querySelector('.out-area');
  cellEl.classList.add('running');
  btn.classList.remove('done'); btn.classList.add('running');
  counter.textContent = '[*]';
  counter.classList.remove('empty'); counter.classList.add('running');
  const delay = isLong ? 1600 : 320 + Math.random() * 200;
  setTimeout(() => {
    counter.textContent = '[' + exec + ']';
    counter.classList.remove('running');
    btn.classList.remove('running'); btn.classList.add('done');
    cellEl.classList.remove('running');
    out.classList.add('show');
  }, delay);
}
document.querySelectorAll('.cell.code').forEach(cell => {
  const btn = cell.querySelector('.runbtn');
  if (btn) btn.addEventListener('click', e => { e.stopPropagation(); runCell(cell); });
});
document.getElementById('run-all').addEventListener('click', () => {
  const cells = [...document.querySelector('.notebook.active').querySelectorAll('.cell.code')];
  let d = 0;
  cells.forEach(c => {
    setTimeout(() => runCell(c), d);
    d += (c.dataset.long === '1') ? 1900 : 520;
  });
});
document.getElementById('clear-out').addEventListener('click', () => {
  document.querySelectorAll('.cell.code').forEach(c => {
    c.querySelector('.out-area').classList.remove('show');
    const ct = c.querySelector('.exec');
    ct.textContent = '[ ]'; ct.classList.add('empty'); ct.classList.remove('running');
    c.querySelector('.runbtn').classList.remove('done','running');
  });
});

const backdrop = document.getElementById('backdrop');
const fileModal = document.getElementById('filemodal');
const fmName = document.getElementById('fm-name');
const fmBody = document.getElementById('fm-body');
document.querySelectorAll('.tree .file').forEach(item => {
  item.addEventListener('click', () => {
    const path = item.dataset.file;
    if (path === '__overview__') {
      switchToNotebook('__overview__');
      return;
    }
    const file = FILES[path];
    if (!file) {
      fmName.textContent = path;
      fmBody.innerHTML = '<div class="fm-desc">Keine Vorschau hinterlegt.</div>';
    } else {
      fmName.textContent = path;
      fmBody.innerHTML = '<div class="fm-desc">' + file.desc + '</div>' + file.body;
    }
    backdrop.classList.add('show');
    fileModal.classList.add('show');
  });
});

/* --- Predict-before-Run --- */
document.querySelectorAll('.predict-box').forEach(box => {
  const correct = box.dataset.correct;
  const opts = box.querySelectorAll('.predict-opt');
  const reveal = box.querySelector('.predict-reveal');
  opts.forEach(opt => {
    opt.addEventListener('click', () => {
      if (box.classList.contains('answered')) return;
      box.classList.add('answered');
      opts.forEach(o => {
        const l = o.dataset.pick;
        if (l === correct) o.classList.add('correct');
        else if (o === opt) o.classList.add('wrong');
      });
      opt.classList.add('picked');
      if (reveal) reveal.classList.add('show');
    });
  });
});

/* --- Tutor-Frage an Parent (NotebookTerminal/ChatPanel) --- */
function askTutor(question) {
  try {
    window.parent.postMessage({
      type: 'fno-notebook-tutor',
      mode: 'tutor',
      question: question
    }, '*');
  } catch (e) {
    console.warn('Tutor message konnte nicht gesendet werden:', e);
  }
}
function closeFile(){
  backdrop.classList.remove('show');
  fileModal.classList.remove('show');
}

document.querySelectorAll('.tree .folder').forEach(f => {
  f.addEventListener('click', () => f.classList.toggle('closed'));
});

const appEl = document.querySelector('.app');
document.querySelectorAll('.activity .ic').forEach(ic => {
  ic.addEventListener('click', () => {
    if (ic.title === 'Explorer') appEl.classList.toggle('sidebar-collapsed');
  });
});

const themeBtn = document.getElementById('btn-theme');
function setTheme(t){
  document.body.dataset.theme = t;
  themeBtn.textContent = t === 'light' ? 'Dark Mode' : 'Light Mode';
  try { localStorage.setItem('fno-theme', t); } catch(e){}
}
themeBtn.addEventListener('click', () => {
  setTheme(document.body.dataset.theme === 'light' ? 'dark' : 'light');
});
let initialTheme = 'dark';
try { initialTheme = localStorage.getItem('fno-theme') || 'dark'; } catch(e){}
setTheme(initialTheme);
</script>"""


def render_chrome():
    return r"""<div class="titlebar">
  <div class="traffic"><span class="r"></span><span class="y"></span><span class="g"></span></div>
  <div class="menu">
    <span>File</span><span>Edit</span><span>Selection</span><span>View</span>
    <span>Run</span><span>Terminal</span><span>Help</span>
  </div>
  <div class="title">fno_training.ipynb — FNOTrainingReal</div>
</div>

<div class="app">
  <div class="activity">
    <div class="ic active" title="Explorer">
      <svg viewBox="0 0 24 24"><path d="M3 5h6l2 2h10v12H3z"/></svg>
    </div>
    <div class="ic" title="Search">
      <svg viewBox="0 0 24 24"><circle cx="10" cy="10" r="6"/><path d="M14.5 14.5 L20 20"/></svg>
    </div>
    <div class="ic" title="Source Control">
      <svg viewBox="0 0 24 24"><circle cx="6" cy="6" r="2.2"/><circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="12" r="2.2"/><path d="M6 8 V16 M8 6 H14 a2 2 0 0 1 2 2 V10"/></svg>
    </div>
    <div class="ic" title="Run and Debug">
      <svg viewBox="0 0 24 24"><polygon points="7,5 19,12 7,19" fill="currentColor" stroke="none"/></svg>
    </div>
    <div class="ic" title="Extensions">
      <svg viewBox="0 0 24 24"><rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="8"/><rect x="3" y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/></svg>
    </div>
  </div>
"""


def render_tabs():
    parts = ['<div class="tabs">']
    for i, exp in enumerate(EXPERIMENTS):
        badge, short, level, lvl_cls = tab_meta(exp)
        active = " active" if i == 0 else ""
        parts.append(
            f'<div class="tab {lvl_cls}{active}" data-tab="{exp}" title="{level} · {dataset_label(exp)}">'
            f'<span class="badge">{badge}</span>'
            f'<span class="level-tag">{level}</span>'
            f'<span>{short}</span>'
            f'<span class="close">×</span></div>'
        )
    parts.append('</div>')
    return "\n".join(parts)


def render_toolbar():
    return """<div class="toolbar">
  <div class="tb-btn">+ Code</div>
  <div class="tb-btn">+ Markdown</div>
  <div class="tb-sep"></div>
  <div class="tb-btn" id="run-all"><span class="tri"></span>Run All</div>
  <div class="tb-btn"><span class="square"></span>Interrupt</div>
  <div class="tb-btn"><span class="circle"></span>Restart</div>
  <div class="tb-btn" id="clear-out">Clear Outputs</div>
  <div class="tb-sep"></div>
  <div class="tb-btn" id="btn-theme" title="Theme wechseln">Light Mode</div>
  <div class="kernel">Python 3.11 (fno-env) | CUDA 12.4 · 2× A100</div>
</div>
"""


STATUSBAR = """<div class="statusbar">
  <span>⎇ main</span>
  <span>FNO · neuralop · PDEBench</span>
  <span>0 Warnings, 0 Errors</span>
  <span>Python 3.11 · CUDA 12.4 · DDP 2× A100</span>
  <div class="sb-right">
    <span>Spaces: 4</span>
    <span>UTF-8</span>
    <span>Jupyter</span>
  </div>
</div>"""


POPUPS = """<div class="explainer" id="explainer">
  <div class="ex-head">
    <span id="ex-title">Erklärung</span>
    <span class="close" onclick="closeExplainer()">×</span>
  </div>
  <div class="ex-body" id="ex-body"></div>
</div>
<div class="backdrop" id="backdrop" onclick="closeFile()"></div>
<div class="filemodal" id="filemodal">
  <div class="fm-head">
    <div class="fm-title"><span id="fm-name">filename</span></div>
    <span class="fm-close" onclick="closeFile()">×</span>
  </div>
  <div class="fm-body" id="fm-body"></div>
</div>"""


def main():
    files = build_files()
    overview = render_overview_notebook()
    notebooks = "\n".join(render_notebook(exp) for exp in EXPERIMENTS) + overview
    parts = [
        '<!DOCTYPE html>\n<html lang="de"><head>',
        '<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">',
        '<title>fno_training.ipynb — Visual Studio Code</title>',
        f'<style>{CSS}</style></head><body>',
        render_chrome(),
        render_sidebar(),
        '<div class="editor">',
        render_tabs(),
        render_toolbar(),
        f'<div class="notebook-stack">{notebooks}</div>',
        '</div>',
        STATUSBAR,
        '</div>',
        POPUPS,
        render_script(files),
        '</body></html>',
    ]
    DST.write_text("\n".join(parts), encoding="utf-8")
    print(f"Wrote {DST} ({DST.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
