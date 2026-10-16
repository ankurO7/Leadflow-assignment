from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import config
from .database import Base, SessionLocal, engine
from .routers_leads import router as leads_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(engine)
    if config.SEED_ON_START:
        from .seed import seed_if_empty

        with SessionLocal() as db:
            seed_if_empty(db)
    yield


app = FastAPI(title="LeadFlow API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(leads_router)


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok"}
