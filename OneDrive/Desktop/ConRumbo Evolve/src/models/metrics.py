import csv
from pathlib import Path
from datetime import datetime
from typing import Optional


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = PROJECT_ROOT / 'datos'
DATA_DIR.mkdir(parents=True, exist_ok=True)
METRICS_FILE = DATA_DIR / 'metrics_log.csv'


class MetricsLogger:
    def __init__(self, metrics_file_path: Path) -> None:
        self.metrics_file_path = metrics_file_path
        self._ensure_file_exists()

    def _ensure_file_exists(self) -> None:
        if not self.metrics_file_path.exists():
            with self.metrics_file_path.open('w', newline='', encoding='utf-8') as file:
                writer = csv.writer(file)
                writer.writerow([
                    'ts_iso',
                    'event',
                    'session_id',
                    'user_text',
                    'intent',
                    'confidence',
                    'protocol_id',
                    'step_index',
                    'latency_ms',
                ])

    def log_event(
        self,
        event: str,
        session_id: str,
        user_text: Optional[str] = None,
        intent: Optional[str] = None,
        confidence: Optional[float] = None,
        protocol_id: Optional[str] = None,
        step_index: Optional[int] = None,
        latency_ms: Optional[float] = None,
    ) -> None:
        timestamp = datetime.now().isoformat()
        row = [
            timestamp,
            event,
            session_id,
            user_text or '',
            intent or '',
            confidence if confidence is not None else '',
            protocol_id or '',
            step_index if step_index is not None else '',
            latency_ms if latency_ms is not None else '',
        ]

        try:
            with self.metrics_file_path.open('a', newline='', encoding='utf-8') as file:
                csv.writer(file).writerow(row)
        except OSError as exc:
            print(f'Error al escribir metricas: {exc}')

    def log_understand_request(
        self,
        session_id: str,
        user_text: str,
        intent: str,
        confidence: float,
        latency_ms: float,
    ) -> None:
        self.log_event(
            event='understand',
            session_id=session_id,
            user_text=user_text,
            intent=intent,
            confidence=confidence,
            latency_ms=latency_ms,
        )

    def log_protocol_request(self, session_id: str, protocol_id: str) -> None:
        self.log_event(
            event='protocol',
            session_id=session_id,
            protocol_id=protocol_id,
        )

    def log_next_step(self, session_id: str, protocol_id: str, step_index: int) -> None:
        self.log_event(
            event='next_step',
            session_id=session_id,
            protocol_id=protocol_id,
            step_index=step_index,
        )

    def log_feedback(self, session_id: str, notes: str) -> None:
        self.log_event(
            event='feedback',
            session_id=session_id,
            user_text=notes,
        )


metrics_logger = MetricsLogger(METRICS_FILE)
