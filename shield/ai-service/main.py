from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.analyze import router as analyze_router
from routes.train import router as train_router
from models.isolation_forest import detector

app = FastAPI(
    title="S.H.I.E.L.D AI Anomaly Detection Service",
    description="Isolation Forest based anomaly detection for smart city access events",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router)
app.include_router(train_router)


@app.get("/health")
async def health():
    return {
        "status": "operational",
        "model_trained": detector.is_trained,
        "service": "shield-ai-anomaly-detection",
    }


@app.on_event("startup")
async def startup():
    """Auto-train model with synthetic data if not already trained."""
    if not detector.is_trained:
        print("[SHIELD-AI] No pre-trained model found. Training on synthetic data...")
        from routes.train import _generate_synthetic_normal_events
        events = _generate_synthetic_normal_events(500)
        result = detector.train(events)
        print(f"[SHIELD-AI] Auto-trained: {result}")
    print("[SHIELD-AI] Anomaly Detection Service — OPERATIONAL")
