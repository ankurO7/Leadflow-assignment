import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/leadflow.db")
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip()]
SEED_ON_START = os.getenv("SEED_ON_START", "false").lower() == "true"
