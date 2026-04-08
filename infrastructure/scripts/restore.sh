#!/bin/bash
# Database Restore Script
# Usage: ./restore.sh <backup_file>
#   backup_file: Path to the .sql.gz backup file

set -e
set -o pipefail

if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file>"
    echo ""
    echo "Examples:"
    echo "  $0 ./backups/mutx_backup_20240315_120000.sql.gz"
    echo "  BACKUP_DIR=./backups $0 latest"
    exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-./backups}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-mutx}"
DB_NAME="${DB_NAME:-mutx}"
DB_PASSWORD="${DB_PASSWORD:-mutx}"

if [ "$1" = "latest" ]; then
    BACKUP_FILE=$(ls -t "$BACKUP_DIR"/mutx_backup_*.sql.gz 2>/dev/null | head -1)
    if [ -z "$BACKUP_FILE" ]; then
        echo "❌ No backup files found in $BACKUP_DIR"
        exit 1
    fi
else
    BACKUP_FILE="$1"
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "Starting database restore..."
echo "  Host: $DB_HOST:$DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  File: $BACKUP_FILE"

read -p "⚠️  This will overwrite the current database. Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

export PGPASSWORD="$DB_PASSWORD"

gunzip -c "$BACKUP_FILE" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"

echo ""
echo "✅ Restore completed successfully!"
