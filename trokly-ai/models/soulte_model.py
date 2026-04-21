import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
import pickle
import os

from models.price_model import (
    IPHONE_MODELS, CONDITIONS, CAPACITIES, GRADES,
    RETAIL_PRICES, CONDITION_MULTIPLIERS, GRADE_MULTIPLIERS,
    CAPACITY_MULTIPLIERS, generate_training_data
)


def estimate_value(iphone_model: str, condition: str, capacity: int, quality_grade: str = "B") -> int:
    base = RETAIL_PRICES.get(iphone_model, 300000)
    value = (
        base
        * CONDITION_MULTIPLIERS.get(condition, 0.6)
        * GRADE_MULTIPLIERS.get(quality_grade, 0.9)
        * CAPACITY_MULTIPLIERS.get(capacity, 1.0)
    )
    return int(round(value / 1000) * 1000)


def generate_soulte_data(n_samples: int = 5000) -> pd.DataFrame:
    np.random.seed(99)
    records = []

    for _ in range(n_samples):
        model_a = np.random.choice(IPHONE_MODELS)
        model_b = np.random.choice(IPHONE_MODELS)
        condition_a = np.random.choice(CONDITIONS)
        condition_b = np.random.choice(CONDITIONS)
        capacity_a = np.random.choice(CAPACITIES)
        capacity_b = np.random.choice(CAPACITIES)
        grade_a = np.random.choice(GRADES, p=[0.4, 0.4, 0.2])
        grade_b = np.random.choice(GRADES, p=[0.4, 0.4, 0.2])

        value_a = estimate_value(model_a, condition_a, capacity_a, grade_a)
        value_b = estimate_value(model_b, condition_b, capacity_b, grade_b)

        soulte = value_b - value_a + np.random.randint(-10000, 10000)
        soulte = int(round(soulte / 1000) * 1000)

        records.append({
            "model_a": model_a, "condition_a": condition_a,
            "capacity_a": capacity_a, "grade_a": grade_a, "value_a": value_a,
            "model_b": model_b, "condition_b": condition_b,
            "capacity_b": capacity_b, "grade_b": grade_b, "value_b": value_b,
            "soulte": soulte,
        })

    return pd.DataFrame(records)


class SoulteModel:
    def __init__(self):
        self.model = None
        self.encoders = {}
        self.model_path = "models/soulte_model.pkl"
        self.is_trained = False

    def _encode(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        cat_cols = ["model_a", "condition_a", "grade_a", "model_b", "condition_b", "grade_b"]
        for col in cat_cols:
            base = "iphone_model" if "model" in col else "condition" if "condition" in col else "grade"
            if col not in self.encoders:
                self.encoders[col] = LabelEncoder()
                self.encoders[col].fit(
                    IPHONE_MODELS if base == "iphone_model" else
                    CONDITIONS if base == "condition" else GRADES
                )
            df[col] = self.encoders[col].transform(df[col])
        return df

    def train(self):
        df = generate_soulte_data(8000)
        features = [
            "model_a", "condition_a", "capacity_a", "grade_a", "value_a",
            "model_b", "condition_b", "capacity_b", "grade_b", "value_b",
        ]
        X = self._encode(df[features])
        y = df["soulte"]

        X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)

        self.model = xgb.XGBRegressor(
            n_estimators=300,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            random_state=42,
        )
        self.model.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)
        self.is_trained = True
        self._save()

    def _save(self):
        os.makedirs("models", exist_ok=True)
        with open(self.model_path, "wb") as f:
            pickle.dump({"model": self.model, "encoders": self.encoders}, f)

    def load(self) -> bool:
        if not os.path.exists(self.model_path):
            return False
        with open(self.model_path, "rb") as f:
            data = pickle.load(f)
        self.model = data["model"]
        self.encoders = data["encoders"]
        self.is_trained = True
        return True

    def predict(
        self,
        model_a: str, condition_a: str, capacity_a: int, grade_a: str,
        model_b: str, condition_b: str, capacity_b: int, grade_b: str,
    ) -> dict:
        if not self.is_trained:
            if not self.load():
                self.train()

        value_a = estimate_value(model_a, condition_a, capacity_a, grade_a)
        value_b = estimate_value(model_b, condition_b, capacity_b, grade_b)

        df = pd.DataFrame([{
            "model_a": model_a, "condition_a": condition_a,
            "capacity_a": capacity_a, "grade_a": grade_a, "value_a": value_a,
            "model_b": model_b, "condition_b": condition_b,
            "capacity_b": capacity_b, "grade_b": grade_b, "value_b": value_b,
        }])

        X = self._encode(df)
        raw = self.model.predict(X)[0]
        soulte = int(round(raw / 1000) * 1000)

        return {
            "suggested_soulte": soulte,
            "initiator_estimated_value": value_a,
            "target_estimated_value": value_b,
            "direction": "initiateur_paie" if soulte > 0 else "vendeur_reçoit_moins" if soulte < 0 else "équilibré",
        }


soulte_model = SoulteModel()
