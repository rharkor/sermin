#!/bin/sh
set -e

$PG_DUMP_PATH -F$PG_FORMAT -Z $PG_COMPRESSION_LEVEL --clean --no-owner -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -f "$PG_OUTPUT_FILE" "$PGDATABASE"
