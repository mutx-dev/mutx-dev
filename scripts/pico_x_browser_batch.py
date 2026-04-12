#!/usr/bin/env python3
import csv
import subprocess
import sys
import time
from pathlib import Path

QUEUE_CSV = Path('/Users/fortune/MUTX/docs/pico-gtm/x-post-queue.csv')
WORKER = '/Users/fortune/MUTX/scripts/pico_x_browser_post.py'
MAX_BATCH = 3


def load_queue():
    if not QUEUE_CSV.exists():
        return [], ['queued_at','target_url','reply_text','action_type','status','notes']
    with QUEUE_CSV.open(newline='') as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames or ['queued_at','target_url','reply_text','action_type','status','notes']
        rows = list(reader)
    return rows, headers


def main():
    rows, headers = load_queue()
    queued = [r for r in rows if (r.get('status') or '').strip().lower() == 'queued']
    if not queued:
        print('[SILENT]')
        return
    processed = 0
    for row in queued[:MAX_BATCH]:
        cmd = [
            'python3', WORKER,
            row['target_url'],
            row['reply_text'],
            row.get('action_type') or 'reply'
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        processed += 1
        print(f"TARGET: {row['target_url']}")
        if result.stdout.strip():
            print(result.stdout.strip())
        if result.stderr.strip():
            print(result.stderr.strip())
        if result.returncode != 0:
            print('BATCH_STOPPED_ON_FAILURE')
            sys.exit(1)
        time.sleep(2)
    print(f'BATCH_COMPLETE processed={processed}')


if __name__ == '__main__':
    main()
