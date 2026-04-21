import os
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
import pickle

IPHONE_MODELS = [
    "iPhone X", "iPhone XR", "iPhone XS", "iPhone XS Max",
    "iPhone 11", "iPhone 11 Pro", "iPhone 11 Pro Max",
    "iPhone 12", "iPhone 12 Mini", "iPhone 12 Pro", "iPhone 12 Pro Max",
    "iPhone 13", "iPhone 13 Mini", "iPhone 13 Pro", "iPhone 13 Pro Max",
    "iPhone 14", "iPhone 14 Plus", "iPhone 14 Pro", "iPhone 14 Pro Max",
    "iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro", "iPhone 15 Pro Max",
    "iPhone 16", "iPhone 16 Plus", "iPhone 16 Pro", "iPhone 16 Pro Max",
]

CONDITIONS = ["new", "like_new", "good", "fair"]
CAPACITIES = [64, 128, 256, 512, 1024]
GRADES = ["A", "B", "C"]

# Prix de référence neufs en FCFA
RETAIL_PRICES = {
    "iPhone X": 220000, "iPhone XR": 240000, "iPhone XS": 280000, "iPhone XS Max": 320000,
    "iPhone 11": 280000, "iPhone 11 Pro": 360000, "iPhone 11 Pro Max": 420000,
    "iPhone 12": 320000, "iPhone 12 Mini": 290000, "iPhone 12 Pro": 420000, "iPhone 12 Pro Max": 480000,
    "iPhone 13": 380000, "iPhone 13 Mini": 340000, "iPhone 13 Pro": 500000, "iPhone 13 Pro Max": 580000,
    "iPhone 14": 450000, "iPhone 14 Plus": 490000, "iPhone 14 Pro": 600000, "iPhone 14 Pro Max": 680000,
    "iPhone 15": 550000, "iPhone 15 Plus": 600000, "iPhone 15 Pro": 720000, "iPhone 15 Pro Max": 820000,
    "iPhone 16": 650000, "iPhone 16 Plus": 700000, "iPhone 16 Pro": 850000, "iPhone 16 Pro Max": 950000,
}

CONDITION_MULTIPLIERS = {"new": 0.90, "like_new": 0.78, "good": 0.62, "fair": 0.45}
GRADE_MULTIPLIERS = {"A": 1.0, "B": 0.90, "C": 0.78}
CAPACITY_MULTIPLIERS = {64: 0.88, 128: 1.0, 256: 1.12, 512: 1.22, 1024: 1.35}


def generate_training_data(n_samples: int = 5000) -> pd.DataFrame:
    np.random.seed(42)
    records = []

    for _ in range(n_samples):
        model = np.random.choice(IPHONE_MODELS)
        condition = np.random.choice(CONDITIONS)
        capacity = np.random.choice(CAPACITIES)
        grade = np.random.choice(GRADES, p=[0.4, 0.4, 0.2])

        base = RETAIL_PRICES.get(model, 300000)
        price = (
            base
            * CONDITION_MULTIPLIERS[condition]
            * GRADE_MULTIPLIERS[grade]
            * CAPACITY_MULTIPLIERS[capacity]
            * np.random.uniform(0.92, 1.08)
        )

        records.append({
            "iphone_model": model,
            "condition": condition,
            "capacity": capacity,
            "quality_grade": grade,
            "retail_price": base,
            "sale_price": int(round(price / 1000) * 1000),
        })

    return pd.DataFrame(records)


class PriceModel:
    def __init__(self):
        self.model = None
        self.encoders = {}
        self.model_path = "models/price_model.pkl"
        self.is_trained = False

    def _encode(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        for col in ["iphone_model", "condition", "quality_grade"]:
            if col not in self.encoders:
                self.encoders[col] = LabelEncoder()
                self.encoders[col].fit(
                    IPHONE_MODELS if col == "iphone_model" else
                    CONDITIONS if col == "condition" else GRADES
                )
            df[col] = self.encoders[col].transform(df[col])
        return df

    def train(self):
        df = generate_training_data(8000)
        features = ["iphone_model", "condition", "capacity", "quality_grade", "retail_price"]
        X = self._encode(df[features])
        y = df["sale_price"]

        X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)

        self.model = xgb.XGBRegressor(
            n_estimators=300,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
        )
        self.model.fit(
            X_train, y_train,
            eval_set=[(X_val, y_val)],
            verbose=False,
        )

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

    def predict(self, iphone_model: str, condition: str, capacity: int, quality_grade: str = "B") -> dict:
        if not self.is_trained:
            if not self.load():
                self.train()

        retail_price = RETAIL_PRICES.get(iphone_model, 300000)

        df = pd.DataFrame([{
            "iphone_model": iphone_model,
            "condition": condition,
            "capacity": capacity,
            "quality_grade": quality_grade,
            "retail_price": retail_price,
        }])

        X = self._encode(df)
        raw = self.model.predict(X)[0]
        suggested = int(round(raw / 1000) * 1000)

        low = int(round(suggested * 0.93 / 1000) * 1000)
        high = int(round(suggested * 1.07 / 1000) * 1000)

        return {
            "suggested_price": suggested,
            "price_range": {"low": low, "high": high},
            "retail_price": retail_price,
        }


price_model = PriceModel()
