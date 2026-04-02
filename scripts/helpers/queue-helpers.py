#!/usr/bin/env python3
"""Helper scripts for queue operations — avoids dense inline python in shell."""

import json
import sys
import datetime

def read_queue(path):
    with open(path) as f:
        return json.load(f)

def write_queue(path, data):
    with open(path, 'w') as f:
        json.dump(data, f, indent=2)

def get_queued_ids(queue_data):
    return {str(item.get('issue', '')) for item in queue_data.get('items', []) if item.get('issue')}

CMD = sys.argv[1] if len(sys.argv) > 1 else ''

if CMD == 'get-queued-ids':
    q = read_queue(sys.argv[2])
    for i in get_queued_ids(q):
        print(i)

elif CMD == 'filter-new-items':
    # Read current queue ids from $QUEUE_FILE
    q = read_queue(sys.argv[2])
    current_ids = get_queued_ids(q)

    # Read gh issues from stdin (piped json)
    gh_issues = json.load(sys.stdin)

    new_items = []
    for issue in gh_issues:
        labels = [l['name'] for l in issue.get('labels', [])]
        issue_num = str(issue['number'])
        if issue_num in current_ids:
            continue
        if 'autonomy:ready' not in labels:
            continue

        size = 'm'
        area = 'area:api'
        for l in labels:
            if l.startswith('size:'):
                size = l.split(':')[1]
            if l.startswith('area:'):
                area = l

        new_items.append({
            'id': f'gh{issue["number"]}',
            'issue': issue['number'],
            'title': issue['title'][:100],
            'description': (issue.get('body') or 'See GitHub issue')[:500],
            'priority': 'p1',
            'area': area,
            'size': size,
            'status': 'queued',
            'lane': 'lane_a_safe',
            'auto_merge': True
        })

    if new_items:
        q.setdefault('items', []).extend(new_items)
        q['generated'] = datetime.datetime.now().isoformat()
        write_queue(sys.argv[2], q)
        print(f'Added {len(new_items)} new items to queue')
    else:
        print('No new autonomy:ready issues found')

elif CMD == 'mark-in-progress':
    q = read_queue(sys.argv[2])
    target_id = sys.argv[3]
    for item in q.get('items', []):
        if item['id'] == target_id:
            item['status'] = 'in_progress'
            break
    write_queue(sys.argv[2], q)

elif CMD == 'remove-item':
    q = read_queue(sys.argv[2])
    target_id = sys.argv[3]
    q['items'] = [i for i in q.get('items', []) if i['id'] != target_id]
    write_queue(sys.argv[2], q)

elif CMD == 'get-top-item':
    q = read_queue(sys.argv[2])
    priority_order = {'p0': 0, 'p1': 1, 'p2': 2}
    queued = [i for i in q.get('items', []) if i.get('status') == 'queued']
    if queued:
        queued.sort(key=lambda x: priority_order.get(x.get('priority', 'p2'), 2))
        print(json.dumps(queued[0]))
