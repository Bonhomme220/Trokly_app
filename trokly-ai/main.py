from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import price, soulte

app = FastAPI(title="Trokly AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(price.router, prefix="/predict", tags=["price"])
app.include_router(soulte.router, prefix="/predict", tags=["soulte"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "trokly-ai"}
