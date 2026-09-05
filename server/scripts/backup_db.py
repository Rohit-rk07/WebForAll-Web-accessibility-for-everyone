"""Logical backup of the app database into gzip JSON-lines archives.

Each archive is a single gzip file containing one document per line, prefixed
with its collection name and a tab. Uses pymongo (already a dependency via
motor), so no `mongodump` install is required.

Example:
    python backup_db.py                        # writes to server/backups/
    python backup_db.py --out Z:\\mongo-backups --keep 14

Prunes old archives, keeping the N most recent (default 30). Exit code 0 on
success so it can be scheduled (see OPERATIONS.md).
"""

import argparse
import gzip
import os
import sys
import time
from pathlib import Path

from bson import json_util

SERVER_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(SERVER_DIR))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(SERVER_DIR / ".env")

from pymongo import MongoClient  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--uri", default=os.environ.get("MONGODB_URI"))
    parser.add_argument(
        "--db", default=os.environ.get("MONGODB_DB_NAME", "accessibility-analyzer")
    )
    parser.add_argument("--out", type=Path, default=SERVER_DIR / "backups")
    parser.add_argument("--keep", type=int, default=30, help="archives to keep")
    args = parser.parse_args()

    if not args.uri:
        print("error: MONGODB_URI is not set", file=sys.stderr)
        return 2
    if args.keep < 1:
        print("error: --keep must be >= 1", file=sys.stderr)
        return 2

    args.out.mkdir(parents=True, exist_ok=True)
    stamp = time.strftime("%Y-%m-%d_%H%M%S")
    archive = args.out / f"backup-{stamp}-{args.db}.json.gz"

    client = MongoClient(args.uri, serverSelectionTimeoutMS=10000)
    db = client[args.db]

    total_docs = 0
    with gzip.open(archive, "wt", encoding="utf-8") as out:
        for name in sorted(db.list_collection_names()):
            count = 0
            for doc in db[name].find():
                out.write(name + "\t" + json_util.dumps(doc) + "\n")
                count += 1
            total_docs += count
            print(f"  {name}: {count} documents")
    client.close()

    backups = sorted(args.out.glob(f"backup-*.{args.db}.json.gz"))
    for stale in backups[:-args.keep]:
        stale.unlink(missing_ok=True)

    print(f"wrote {archive} ({total_docs} docs); keeping last {args.keep}")
    return 0


if __name__ == "__main__":
    sys.exit(main())