#!/bin/bash
# Queue feeder — runs every 15 minutes via cron
# Adds new autonomy:ready GitHub issues to the action queue

QUEUE_FILE="/Users/fortune/MUTX/mutx-engineering-agents/dispatch/action-queue.json"
cd /Users/fortune/MUTX

# Get current queued issue IDs
current_ids=$(python3 -c "import json; q=json.load(open('$QUEUE_FILE')); print('\n'.join([i.get('issue','') for i in q.get('items',[])]))" 2>/dev/null)

# Find open autonomy:ready issues not already in queue
gh issue list --state open --limit 50 --json number,title,body,labels 2>/dev/null | python3 -c "
import json, sys, datetime

try:
    data = json.load(sys.stdin)
except: sys.exit(0)

current_ids = set()
try:
    q = json.load(open('$QUEUE_FILE'))
    for item in q.get('items', []):
        if item.get('issue'):
            current_ids.add(str(item['issue']))
except: pass

new_items = []
for issue in data:
    labels = [l['name'] for l in issue.get('labels', [])]
    if str(issue['number']) in current_ids:
        continue
    if 'autonomy:ready' not in labels:
        continue
    
    # Determine size from labels
    size = 'm'
    for l in labels:
        if l.startswith('size:'):
            size = l.split(':')[1]
    
    # Determine area
    area = 'area:api'
    for l in labels:
        if l.startswith('area:'):
            area = l
    
    new_items.append({
        'id': f'gh{issue[\"number\"]}',
        'issue': issue['number'],
        'title': issue['title'][:100],
        'description': (issue.get('body') or 'See GitHub issue')[0:500],
        'priority': 'p1',
        'area': area,
        'size': size,
        'status': 'queued',
        'lane': 'lane_a_safe',
        'auto_merge': True
    })

if new_items:
    try:
        q = json.load(open('$QUEUE_FILE'))
    except:
        q = {'version': '1.1.0', 'generated': datetime.datetime.now().isoformat(), 'items': []}
    
    q['items'].extend(new_items)
    q['generated'] = datetime.datetime.now().isoformat()
    
    with open('$QUEUE_FILE', 'w') as f:
        json.dump(q, f, indent=2)
    print(f'Added {len(new_items)} new items to queue')
else:
    print('No new autonomy:ready issues found')
" 2>/dev/null
