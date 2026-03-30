from pathlib import Path
import re

base = Path('/Users/fortune/.openclaw/workspace/skills/public')
changed = []
for ref in base.glob('*/references/*.md'):
    text = ref.read_text()
    lines = text.splitlines()
    if len(lines) <= 100:
        continue
    head = '\n'.join(lines[:25]).lower()
    has_toc = ('table of contents' in head) or any(l.strip().startswith('- [') for l in lines[:25])
    if has_toc:
        continue
    headings = []
    for line in lines[1:]:
        m = re.match(r'^(##+)\s+(.*)$', line)
        if not m:
            continue
        level = len(m.group(1)) - 2
        title = m.group(2).strip()
        anchor = title.lower()
        anchor = re.sub(r'[`*_]', '', anchor)
        anchor = re.sub(r'[^a-z0-9\s-]', '', anchor)
        anchor = re.sub(r'\s+', '-', anchor).strip('-')
        if not anchor:
            continue
        headings.append((level, title, anchor))
    if not headings:
        continue
    insert_at = 1
    while insert_at < len(lines) and lines[insert_at].strip() == '':
        insert_at += 1
    toc = ['','## Contents','']
    for level, title, anchor in headings:
        indent = '  ' * level
        toc.append(f"{indent}- [{title}](#{anchor})")
    toc.append('')
    new_lines = lines[:insert_at] + toc + lines[insert_at:]
    ref.write_text('\n'.join(new_lines) + '\n')
    changed.append(str(ref))

print('\n'.join(changed))
print(f'changed={len(changed)}')
