"""Restore one backup archive produced by `backup_db.py`.

Default mode inserts documents, skipping any whose `_id` already exists in the
target database (safe merge). With `--drop`, the affected collections are
dropped first (full replace) and the archive becomes the source of truth.

Indexes are NOT restored here; the app recreates them on startup via
`services.db.init_indexes`. Verify after restore: `GET /health`, a login, and
`GET /history`.

Example:
    python restore_db.py backups/backup-2026-01-01_020000-accessibility-analyzer.json.gz
    python restore_db.py backups/backup-2026-01-01_020000-accessibility-analyzer.json.gz --drop
"""

import argparse
import gzip
import os
import sys
from pathlib import Path

from bson import json_util
from pymongo.errors import DuplicateKeyError

SERVER_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(SERVER_DIR))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(SERVER_DIR / ".env")

from pymongo import MongoClient  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path, help="path to the .json.gz archive")
    parser.add_argument("--uri", default=os.environ.get("MONGODB_URI"))
    parser.add_argument(
        "--db", default=os.environ.get("MONGODB_DB_NAME", "accessibility-analyzer")
    )
    parser.add_argument(
        "--drop",
        action="store_true",
        help="drop target collections before inserting (full replace)",
    )
    args = parser.parse_args()

    if not args.uri:
        print("error: MONGODB_URI is not set", file=sys.stderr)
        return 2
    if not args.archive.exists():
        print(f"error: archive not found: {args.archive}", file=sys.stderr)
        return 2

    docs_by_collection: dict[str, list] = {}
    with gzip.open(args.archive, "rt", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            coll, _, raw = line.partition("\t")
            docs_by_collection.setdefault(coll, []).append(json_util.loads(raw))

    client = MongoClient(args.uri, serverSelectionTimeoutMS=10000)
    db = client[args.db]

    total = 0
    for coll, docs in sorted(docs_by_collection.items()):
        if args.drop:
            db[coll].drop()
            print(f"  {coll}: dropped")
        inserted = 0
        skipped = 0
        for doc in docs:
            try:
                db[coll].insert_one(doc)
                inserted += 1
            except DuplicateKeyError:
                skipped += 1
            except Exception as exc:  # noqa: BLE001 - surface unexpected failures
                print(f"  {coll}: failed on _id={doc.get('_id')}: {exc}", file=sys.stderr)
                skipped += 1
        total += inserted
        print(f"  {coll}: inserted {inserted}, skipped {skipped}")
    client.close()

    print(f"restored {total} documents to db={args.db}")
    print("verify: GET /health, a login, and GET /history. Indexes are recreated by the app on startup.")
    return 0


if __name__ == "__main__":
    sys.exit(main())