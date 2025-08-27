"""MongoDB connection setup using Motor (async)."""

import os
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URI = os.environ.get("MONGODB_URI")
DB_NAME = os.environ.get("MONGODB_DB_NAME", "webforall")

if not MONGODB_URI:
    # Fail-fast is acceptable; caller should ensure env is set.
    raise RuntimeError("MONGODB_URI environment variable is not set")

client = AsyncIOMotorClient(MONGODB_URI)
db = client[DB_NAME]

# Collections
users = db["users"]
password_reset_tokens = db["password_reset_tokens"]
analyses = db["analyses"]


async def init_indexes():
    """Create required indexes (idempotent)."""
    # Unique email for users
    await users.create_index("email", unique=True)
    # TTL index for password reset tokens; expire at expiresAt
    await password_reset_tokens.create_index("expiresAt", expireAfterSeconds=0)
    # Analyses indexes for querying by user and order by date
    await analyses.create_index("owner_email")
    await analyses.create_index([("created_at", 1)])


async def seed_default_users(get_password_hash):
    """Seed default users if not present."""
    existing_test = await users.find_one({"email": "test@example.com"})
    if not existing_test:
        await users.insert_one({
            "email": "test@example.com",
            "full_name": "Test User",
            "hashed_password": get_password_hash("password123"),
            "disabled": False,
            "created_at": datetime.utcnow(),
        })
    existing_admin = await users.find_one({"email": "admin@example.com"})
    if not existing_admin:
        await users.insert_one({
            "email": "admin@example.com",
            "full_name": "Admin User",
            "hashed_password": get_password_hash("admin123"),
            "disabled": False,
            "created_at": datetime.utcnow(),
        })
