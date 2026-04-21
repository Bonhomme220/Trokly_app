from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal
from models.price_model import price_model, IPHONE_MODELS, CONDITIONS, CAPACITIES, GRADES

router = APIRouter()


class PriceRequest(BaseModel):
    iphone_model: str
    condition: Literal["new", "like_new", "good", "fair"]
    capacity: Literal[64, 128, 256, 512, 1024]
    quality_grade: Literal["A", "B", "C"] = "B"


@router.post("/price")
def predict_price(req: PriceRequest):
    if req.iphone_model not in IPHONE_MODELS:
        raise HTTPException(status_code=422, detail=f"Modèle inconnu : {req.iphone_model}")

    result = price_model.predict(
        iphone_model=req.iphone_model,
        condition=req.condition,
        capacity=req.capacity,
        quality_grade=req.quality_grade,
    )

    return {
        "iphone_model": req.iphone_model,
        "condition": req.condition,
        "capacity": req.capacity,
        **result,
    }


@router.get("/models")
def get_models():
    return {
        "iphone_models": IPHONE_MODELS,
        "conditions": CONDITIONS,
        "capacities": CAPACITIES,
        "grades": GRADES,
    }
