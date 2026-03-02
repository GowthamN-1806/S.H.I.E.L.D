import numpy as np
import json
from pathlib import Path


class BehavioralBaseline:
    """Stores and compares per-user behavioral baselines."""

    def __init__(self, storage_path: str = "/tmp/shield_baselines.json"):
        self.storage_path = Path(storage_path)
        self.baselines: dict = {}
        self._load()

    def _load(self):
        if self.storage_path.exists():
            try:
                self.baselines = json.loads(self.storage_path.read_text())
            except Exception:
                self.baselines = {}

    def _save(self):
        self.storage_path.write_text(json.dumps(self.baselines, default=str))

    def update_baseline(self, user_id: str, features: list[float]):
        """Update the rolling average baseline for a user."""
        if user_id not in self.baselines:
            self.baselines[user_id] = {
                "mean": features,
                "count": 1,
            }
        else:
            entry = self.baselines[user_id]
            count = entry["count"]
            old_mean = np.array(entry["mean"])
            new_mean = (old_mean * count + np.array(features)) / (count + 1)
            entry["mean"] = new_mean.tolist()
            entry["count"] = min(count + 1, 1000)  # cap history
        self._save()

    def get_deviation(self, user_id: str, features: list[float]) -> float:
        """Get deviation score between current features and baseline."""
        if user_id not in self.baselines:
            return 0.0
        baseline = np.array(self.baselines[user_id]["mean"])
        current = np.array(features)
        # Euclidean distance normalized by number of features
        deviation = float(np.linalg.norm(current - baseline) / len(features))
        return deviation

    def has_baseline(self, user_id: str) -> bool:
        return user_id in self.baselines

    def get_user_count(self) -> int:
        return len(self.baselines)
