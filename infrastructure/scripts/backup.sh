#!/bin/bash
# Database Backup Script
# Usage: ./backup.sh [backup_name]

set -e

BACKUP_DIR="${BACKUP_DIR:-./backups}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-mutx}"
DB_NAME="${DB_NAME:-mutx}"
DB_PASSWORD="${DB_PASSWORD:-mutx}"

mkdir -p "$BACKUP_DIR"

if [ -n "$1" ]; then
    BACKUP_NAME="$1"
else
    BACKUP_NAME="mutx_backup_$(date +%Y%m%d_%H%M%S)"
fi

BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}.sql.gz"

echo "Starting database backup..."
echo "  Host: $DB_HOST:$DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Output: $BACKUP_FILE"

export PGPASSWORD="$DB_PASSWORD"

pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ -f "$BACKUP_FILE" ]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo ""
    echo "✅ Backup completed successfully!"
    echo "   File: $BACKUP_FILE"
    echo "   Size: $SIZE"
    if [ "$AUTO_CLEANUP" = "true" ]; then
        echo ""
        echo "🧹 Cleaning up old backups (keeping last 7)..."
        cd "$BACKUP_DIR" && ls -t mutx_backup_*.sql.gz 2>/dev/null | tail -n +8 | xargs -r rm -f
    fi
else
    echo "❌ Backup failed!"
    exit 1
fi
