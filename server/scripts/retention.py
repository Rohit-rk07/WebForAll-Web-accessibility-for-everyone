"""Retention policy: purge analyses older than `--days` (default 90 = 3 months).

Dry-run by default: only reports how many documents would be deleted. Pass
`--apply` to actually delete. Reads MONGODB_URI / MONGODB_DB_NAME from
server/.env (or the environment). Safe to schedule monthly (see OPERATIONS.md).

Account records and reset tokens are untouched: password-reset tokens already
auto-expire via their TTL index, and user accounts live until deleted.
"""

import argparse
import datetime
import os
import sys
from pathlib import Path

SERVER_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(SERVER_DIR))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(SERVER_DIR / ".env")

from pymongo import MongoClient  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--days", type=int, default=90)
    parser.add_argument("--db", default=os.environ.get("MONGODB_DB_NAME", "accessibility-analyzer"))
    parser.add_argument("--collection", default="analyses")
    parser.add_argument("--apply", action="store_true", help="actually delete (default is dry-run)")
    args = parser.parse_args()

    uri = os.environ.get("MONGODB_URI")
    if not uri:
        print("error: MONGODB_URI is not set", file=sys.stderr)
        return 2
    if args.days < 1:
        print("error: --days must be >= 1", file=sys.stderr)
        return 2

    cutoff = datetime.datetime.utcnow() - datetime.timedelta(days=args.days)
    client = MongoClient(uri, serverSelectionTimeoutMS=10000)
    coll = client[args.db][args.collection]
    query = {"created_at": {"$lt": cutoff}}

    total = coll.count_documents(query)
    if args.apply:
        deleted = coll.delete_many(query).deleted_count
        client.close()
        print(f"deleted {deleted} documents older than {args.days} days ({cutoff.date()})")
        return 0

    client.close()
    print(
        f"DRY RUN: {total} documents older than {args.days} days ({cutoff.date()}) "
        f"would be deleted from {args.db}.{args.collection}. Re-run with --apply."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())