from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal
from models.soulte_model import soulte_model
from models.price_model import IPHONE_MODELS

router = APIRouter()


class SoulteRequest(BaseModel):
    # Téléphone de l'initiateur (troceur)
    initiator_model: str
    initiator_condition: Literal["new", "like_new", "good", "fair"]
    initiator_capacity: Literal[64, 128, 256, 512, 1024]
    initiator_grade: Literal["A", "B", "C"] = "B"

    # Téléphone cible (annonce)
    target_model: str
    target_condition: Literal["new", "like_new", "good", "fair"]
    target_capacity: Literal[64, 128, 256, 512, 1024]
    target_grade: Literal["A", "B", "C"] = "B"


@router.post("/soulte")
def predict_soulte(req: SoulteRequest):
    for model in [req.initiator_model, req.target_model]:
        if model not in IPHONE_MODELS:
            raise HTTPException(status_code=422, detail=f"Modèle inconnu : {model}")

    result = soulte_model.predict(
        model_a=req.initiator_model,
        condition_a=req.initiator_condition,
        capacity_a=req.initiator_capacity,
        grade_a=req.initiator_grade,
        model_b=req.target_model,
        condition_b=req.target_condition,
        capacity_b=req.target_capacity,
        grade_b=req.target_grade,
    )

    return {
        "initiator": {
            "model": req.initiator_model,
            "condition": req.initiator_condition,
            "capacity": req.initiator_capacity,
        },
        "target": {
            "model": req.target_model,
            "condition": req.target_condition,
            "capacity": req.target_capacity,
        },
        **result,
    }
