from pathlib import Path
import re, textwrap, json, subprocess, html

posts_path = Path('/Users/fortune/.openclaw/workspace-x/queue/posts_ready.md')
text = posts_path.read_text()

improved = {
    'Repo Update 2': """the kind of command we want more of in agent infra:\n\n`npm run demo:validate`\n\nif the demo path is real, it should be explicit, repeatable, and falsifiable.\n\nless folklore.\nmore verification.""",
    'Repo Update 3': """MUTX is starting to read less like another agent framework\nand more like what it actually wants to be:\n\na control plane around agent runtimes.\n\nthat distinction matters the moment execution stops being a toy task.""",
    'Repo Update 4': """ownership checks on agent endpoints look like backend detail\nright up until agents can deploy, stop, and stream logs.\n\nthen \"who can touch what\" becomes product.""",
    'Repo Update 5': """self-healing and alerting sound like ops polish\nuntil the first run stalls silently.\n\nthen they stop being polish\nand start being the product.""",
    'Repo Update 6': """OpenClaw + MUTX is a useful split:\n\nOpenClaw is the runtime surface.\nMUTX is the control, visibility, and operator layer around it.\n\nthat stack is getting sharper.""",
    'Repo Update 20': """MUTX v1.1 shipped.\n\nreal install:\n`curl -fsSL https://mutx.dev/install.sh | bash`\n\nreal bootstrap:\ncompose + migrations + sane defaults\n\nreal runtime:\nOpenClaw as a tracked provider\n\nreal surface:\nCLI + TUI + API + dashboard that agree on the same objects.""",
    'Repo Update 21': """the demo path now survives contact with reality.\n\ncompose names don't collide.\nmigrations run before readiness checks.\n`/ready` replaced a weaker signal.\nlocal JWT defaults boot the stack.\n\n`npm run demo:validate` is no longer a vibe.\nit's a falsifiable claim.""",
    'Repo Update 22': """too many agent products can generate output\nand still can't explain how to operate, inspect, or recover the system around the runtime.\n\nMUTX v1.1 is trying to close that gap:\nreal install.\ntracked runtime.\nshared objects across CLI, TUI, API, and dashboard.""",
    'Repo Update 7': """small infra detail, big product consequence:\n\nownership checks on agent endpoints.\n\nonce agents can deploy, stop, and stream logs,\nauth stops being backend cleanup\nand becomes control-plane reality.""",
    'Repo Update 8': """most teams only get serious about timeouts\nafter one run hangs in a weird half-state.\n\ntimeouts aren't cleanup.\nthey're runtime policy.""",
    'Repo Update 9': """boring UI work matters more than people think.\n\nnormalizing dashboard error handling\nis how a control surface stops feeling random\nwhen the API doesn't cooperate.""",
    'Repo Update 10': """\"we have a dashboard\"\nand\n\"the dashboard is the canonical operator surface\"\nare different milestones.\n\nthe second one is where the product starts taking shape.""",
    'Repo Update 11': """self-healing scripts look unsexy in the diff\nand obvious at 3am.\n\nnobody celebrates them until something stalls silently.\n\nthen they're the feature.""",
    'Repo Update 12': """one underrated trust signal in infra products:\n\nsupported surface\nvs\naspirational surface.\n\nthat honesty builds more trust\nthan pretending the dashboard is already done.""",
    'Repo Update 13': """one of the easiest auth changes to underrate in agent infra:\n\nownership enforcement on deploy, stop, and logs.\n\noperator boundaries start there.""",
    'Repo Update 14': """486 lines of self-healing + alert wiring\nis the kind of diff that looks boring\nuntil something breaks at 3am.\n\nthen it stops being ops polish\nand starts being product.""",
    'Repo Update 15': """an app shell is not a control surface.\n\nthe milestone that matters is when the app becomes\nthe canonical place an operator can actually manage reality.\n\nthat's where control-plane software starts taking shape.""",
    'Repo Update 16': """there's a big difference between\n\"we have a dashboard\"\nand\n\"the dashboard is becoming the canonical operator surface.\"\n\nthat second milestone is where control-plane software\nstarts feeling like a product.""",
    'Repo Update 17': """small auth commit.\nbig operator consequence.\n\nonce agents can deploy, stop, and stream logs,\nownership checks stop being backend cleanup\nand become product boundaries.""",
    'Repo Update 18': """the infra work that looks the most boring in a screenshot\nis often the part that matters most in production.\n\nself-healing is a good example.""",
    'Repo Update 19': """most teams only get serious about timeout enforcement\nafter one run hangs in a weird half-state.\n\ntimeouts are not cleanup.\nthey're part of the runtime contract.""",
    'Quote-RT 1': """the hard part of agent infra isn't getting the demo to run.\n\nit's keeping the system coherent, inspectable, and recoverable once execution runs long.\n\nthat's the layer a lot of the discourse skips.""",
    'Quote-RT 2': """shipping an app shell is not the same milestone\nas making it the canonical operator surface.\n\nthat second milestone is where control-plane software\nstarts taking product shape.""",
    'Media Hook 1': """infra credibility comes from boring proof, not flashy demos.\n\nthe strongest media is usually the one that lets people verify\nthe stack is actually alive.""",
    'Media Hook 2': """the most underrated demo in agent infra:\n\none command that proves the auth path is real.\n\nnot slides.\nnot mock UI.\njust a falsifiable response anyone can reproduce.""",
    'Repo Update 23': """small credential handoff bug.\nreal onboarding consequence.\n\nhow credentials flow from setup into the gateway auth layer\nsounds like plumbing.\n\nit's often the difference between\n\"the quickstart worked\" and \"the onboarding stuck.\"""",
    'Quote-RT 3': """the difference between shipping agents\nand operating them reliably\nis where most of the real engineering lives.\n\nthat second layer is the control plane.""",
    'Quote-RT 4': """getting an agent to run is a demo problem.\n\nkeeping it coherent, inspectable, and recoverable\nunder real interruptions is an infrastructure problem.\n\na lot of discourse still conflates the two.""",
    'Quote-RT 5': """a running agent and a controllable agent\nare different products.\n\nthe second one needs\nstate visibility, operator intervention, and recovery paths.\n\nthat's the stack.""",
    'Media Hook 3': """what control looks like when it works:\n\na run stalled.\nthe log showed where.\na human could intervene.\nresume held state.\n\nthat's the product.""",
    'Media Hook 4': """the most believable screenshot in agent infra\nisn't the one that looks best.\n\nit's the one that shows what was actually alive.""",
    'Media Hook 5': """1,352 commits.\none install command.\na local control plane that boots without secret patching.\n\nthe proof is less impressive than the demo.\n\nit's more useful.""",
    'Quote-RT 6': """autonomy expands scope.\n\nit also expands the operator question:\nwhat ran, what failed, and what needs a human next.\n\nthat's where a lot of agent products become control-plane products.""",
    'Media Hook 6': """best kind of infra screenshot:\n\nthe docs, the command, and the result all agree.\n\nif the quickstart says `make dev` and `make test-auth`,\nthe proof should be exactly that.""",
}

def replace_draft(block, new_draft):
    pattern = re.compile(r'(^- Draft:\n)(.*?)(?=^-(?: Notes|Status|Category|Created|Commit|Hook|Angle):|^### |\Z)', re.M|re.S)
    m = pattern.search(block)
    if m:
        return block[:m.start(2)] + new_draft.rstrip() + '\n' + block[m.end(2):]
    pattern2 = re.compile(r'(^- Draft:\s*)(.*)$', re.M)
    m2 = pattern2.search(block)
    if m2:
        return block[:m2.start(2)] + new_draft.replace('\n',' / ') + block[m2.end(2):]
    return block

parts = re.split(r'(?=^### )', text, flags=re.M)
out_parts = []
updated = []
for part in parts:
    if not part.startswith('### '):
        out_parts.append(part)
        continue
    title = part.splitlines()[0][4:].strip()
    status_m = re.search(r'^- Status:\s*(\w+)', part, flags=re.M)
    status = status_m.group(1) if status_m else ''
    if title in improved and status == 'READY':
        part = replace_draft(part, improved[title])
        updated.append(title)
    out_parts.append(part)
new_text = ''.join(out_parts)
posts_path.write_text(new_text)

text = posts_path.read_text()
blocks = re.split(r'(?=^### )', text, flags=re.M)
entries = []
for block in blocks:
    if not block.startswith('### '):
        continue
    title = block.splitlines()[0][4:].strip()
    status_m = re.search(r'^- Status:\s*(\w+)', block, flags=re.M)
    status = status_m.group(1) if status_m else ''
    if status != 'READY':
        continue
    cat_m = re.search(r'^- Category:\s*(.*)', block, flags=re.M)
    category = cat_m.group(1).strip() if cat_m else ''
    created_m = re.search(r'^- Created:\s*(.*)', block, flags=re.M)
    created = created_m.group(1).strip() if created_m else ''
    draft_m = re.search(r'^- Draft:\n(.*?)(?=^-(?: Notes|Status|Category|Created|Commit|Hook|Angle):|^### |\Z)', block, flags=re.M|re.S)
    draft = draft_m.group(1).strip() if draft_m else ''
    notes_m = re.search(r'^- Notes:\s*(.*)', block, flags=re.M)
    notes = notes_m.group(1).strip() if notes_m else ''
    entries.append({'title': title, 'category': category, 'created': created, 'draft': draft, 'notes': notes})


def media_plan(entry):
    cat = entry['category']
    d = entry['draft'].lower()
    if cat == 'quote-RT':
        return {
            'asset': 'text-first quote card',
            'truthful_capture': 'Usually text-only is best; if media is desired, use a branded quote card with the exact hook and no fake product UI.',
            'fallback': 'Use generated social card.'
        }
    if cat == 'media-hook':
        if 'auth' in d or 'quickstart' in d or 'make test-auth' in d or 'docs' in d or 'command' in d:
            return {
                'asset': 'terminal proof still or 6–8s terminal clip',
                'truthful_capture': 'Tight crop of command + output only. Redact tokens. Prefer dark terminal on clean background.',
                'fallback': 'Use generated social card until truthful capture is ready.'
            }
        return {
            'asset': 'branded social card or proof-led screenshot',
            'truthful_capture': 'Prefer a real terminal, dashboard, or docs crop that matches the claim; otherwise use the generated card.',
            'fallback': 'Use generated social card.'
        }
    if 'install' in d or 'demo' in d or 'auth' in d or 'credential' in d or 'quickstart' in d or 'bootstrap' in d:
        return {
            'asset': 'terminal proof still / short setup clip',
            'truthful_capture': 'Show the command, the output, and one useful result. Crop tight. No desktop clutter.',
            'fallback': 'Generated card + follow-up proof thread later.'
        }
    if 'dashboard' in d or 'operator surface' in d or 'ui' in d:
        return {
            'asset': 'dashboard crop or docs + UI split card',
            'truthful_capture': 'Use a real dashboard crop or split-screen with docs/README on one side and the live surface on the other.',
            'fallback': 'Generated card.'
        }
    if 'timeout' in d or 'self-healing' in d or 'alert' in d or 'stalls' in d:
        return {
            'asset': 'terminal/log timeline card',
            'truthful_capture': 'Use a real log snippet, alert event, or clean status timeline showing the failure/repair concept.',
            'fallback': 'Generated card.'
        }
    if 'control plane' in d or 'runtime' in d:
        return {
            'asset': 'minimal architecture card',
            'truthful_capture': 'Use a simple runtime/control split diagram or pair with a truthful product surface crop.',
            'fallback': 'Generated card.'
        }
    return {
        'asset': 'branded social card',
        'truthful_capture': 'Prefer a real product/docs/terminal crop if one directly supports the claim.',
        'fallback': 'Generated card.'
    }

cards_dir = Path('/Users/fortune/.openclaw/workspace-x/artifacts/social-cards')
cards_dir.mkdir(parents=True, exist_ok=True)

def slugify(s):
    s = s.lower()
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    return s

def wrap_text_preserve_paragraphs(text, width=30):
    lines = []
    for para in text.split('\n'):
        if not para.strip():
            lines.append('')
            continue
        wrapped = textwrap.wrap(para, width=width, break_long_words=False, break_on_hyphens=False)
        lines.extend(wrapped or [''])
    while lines and lines[-1] == '':
        lines.pop()
    return lines

html_items = []
manifest = []
for i, entry in enumerate(entries, 1):
    title = entry['title']
    cat = entry['category'] or 'post'
    draft = entry['draft']
    slug = f"{i:02d}-{slugify(title)}"
    svg_path = cards_dir / f"{slug}.svg"
    png_path = cards_dir / f"{slug}.png"
    lines = wrap_text_preserve_paragraphs(draft, width=30)
    font_size = 54
    line_height = 68
    if len(lines) > 11:
        font_size = 46
        line_height = 58
    if len(lines) > 14:
        font_size = 40
        line_height = 50
    x = 120
    y = 180
    text_svg = []
    for line in lines:
        if line == '':
            y += int(line_height * 0.55)
            continue
        safe = html.escape(line)
        text_svg.append(f"<text x='{x}' y='{y}' fill='white' font-size='{font_size}' font-family='Helvetica, Arial, sans-serif' font-weight='700'>{safe}</text>")
        y += line_height
    title_safe = html.escape(title)
    cat_safe = html.escape(cat.upper())
    svg = f"""<svg xmlns='http://www.w3.org/2000/svg' width='1600' height='900' viewBox='0 0 1600 900'>
  <defs>
    <linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0%' stop-color='#060915'/>
      <stop offset='55%' stop-color='#0b1020'/>
      <stop offset='100%' stop-color='#111827'/>
    </linearGradient>
    <linearGradient id='accent' x1='0' y1='0' x2='1' y2='0'>
      <stop offset='0%' stop-color='#8b5cf6'/>
      <stop offset='100%' stop-color='#22d3ee'/>
    </linearGradient>
  </defs>
  <rect width='1600' height='900' fill='url(#bg)'/>
  <circle cx='1370' cy='180' r='220' fill='#8b5cf6' opacity='0.10'/>
  <circle cx='1280' cy='760' r='260' fill='#22d3ee' opacity='0.08'/>
  <rect x='120' y='90' width='220' height='8' rx='4' fill='url(#accent)'/>
  <text x='120' y='145' fill='#8b5cf6' font-size='28' font-family='Helvetica, Arial, sans-serif' font-weight='700'>{cat_safe}</text>
  <text x='1480' y='145' text-anchor='end' fill='#94a3b8' font-size='26' font-family='Helvetica, Arial, sans-serif'>{title_safe}</text>
  {''.join(text_svg)}
  <text x='120' y='835' fill='#cbd5e1' font-size='28' font-family='Helvetica, Arial, sans-serif' font-weight='700'>MUTX</text>
  <text x='1480' y='835' text-anchor='end' fill='#94a3b8' font-size='24' font-family='Helvetica, Arial, sans-serif'>mutx.dev</text>
</svg>"""
    svg_path.write_text(svg)
    subprocess.run(['sips', '-s', 'format', 'png', str(svg_path), '--out', str(png_path)], check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if not png_path.exists():
        subprocess.run(['qlmanage', '-t', '-s', '1600', '-o', str(cards_dir), str(svg_path)], check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        ql_png = cards_dir / f"{svg_path.name}.png"
        if ql_png.exists():
            ql_png.rename(png_path)
    plan = media_plan(entry)
    manifest.append({
        'index': i,
        'title': title,
        'category': cat,
        'png': png_path.name,
        'svg': svg_path.name,
        'draft': draft,
        'notes': entry['notes'],
        'asset': plan['asset'],
        'truthful_capture': plan['truthful_capture'],
        'fallback': plan['fallback'],
    })
    html_items.append(f"""<div class='card'>
      <a href='{png_path.name}' target='_blank'><img src='{png_path.name}' alt='{html.escape(title)}'></a>
      <div class='meta'><strong>{i}. {html.escape(title)}</strong><span>{html.escape(cat)}</span></div>
      <pre>{html.escape(draft)}</pre>
    </div>""")

(cards_dir / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
(cards_dir / 'index.html').write_text(f"""<!doctype html>
<html><head><meta charset='utf-8'><title>MUTX X Draft Cards</title>
<style>
body{{font-family:Inter,system-ui,sans-serif;background:#0b1020;color:#e2e8f0;margin:0;padding:32px}}
h1{{margin:0 0 8px}} p{{color:#94a3b8}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:24px;margin-top:24px}}
.card{{background:#111827;border:1px solid #1f2937;border-radius:16px;padding:16px}}
img{{width:100%;height:auto;border-radius:12px;display:block}}
.meta{{display:flex;justify-content:space-between;gap:12px;margin:12px 0 8px;font-size:14px;color:#94a3b8}}
pre{{white-space:pre-wrap;word-wrap:break-word;background:#0f172a;padding:12px;border-radius:12px;font-size:13px;line-height:1.45}}
a{{color:#22d3ee;text-decoration:none}}
</style></head>
<body>
<h1>MUTX X draft cards</h1>
<p>Improved READY drafts + generated fallback social cards. Truthful product proof should still replace cards when available.</p>
<div class='grid'>{''.join(html_items)}</div>
</body></html>""")

bp_path = Path('/Users/fortune/.openclaw/workspace-x/queue/media_blueprints.md')
lines = ['# media_blueprints.md', '', 'Improved draft-to-media mapping for READY MUTX X posts.', '']
for item in manifest:
    lines += [
        f"## {item['index']}. {item['title']}",
        f"- Category: {item['category']}",
        f"- Fallback card: `artifacts/social-cards/{item['png']}`",
        f"- Best asset type: {item['asset']}",
        f"- Truthful capture: {item['truthful_capture']}",
        f"- Fallback usage: {item['fallback']}",
        ''
    ]
bp_path.write_text('\n'.join(lines))

print('updated drafts:', len(updated))
print('ready entries:', len(entries))
print('cards dir:', cards_dir)
print('blueprints:', bp_path)
