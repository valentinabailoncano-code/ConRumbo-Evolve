import csv
import os
from datetime import datetime
from typing import Optional

class MetricsLogger:
    def __init__(self, metrics_file_path: str):
        self.metrics_file_path = metrics_file_path
        self._ensure_file_exists()
    
    def _ensure_file_exists(self):
        """Asegurar que el archivo de métricas existe con las cabeceras correctas"""
        if not os.path.exists(self.metrics_file_path):
            # Crear el directorio si no existe
            os.makedirs(os.path.dirname(self.metrics_file_path), exist_ok=True)
            
            # Crear el archivo con cabeceras
            with open(self.metrics_file_path, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow([
                    'ts_iso', 'event', 'session_id', 'user_text', 
                    'intent', 'confidence', 'protocol_id', 'step_index', 'latency_ms'
                ])
    
    def log_event(self, 
                  event: str,
                  session_id: str,
                  user_text: Optional[str] = None,
                  intent: Optional[str] = None,
                  confidence: Optional[float] = None,
                  protocol_id: Optional[str] = None,
                  step_index: Optional[int] = None,
                  latency_ms: Optional[float] = None):
        """
        Registrar un evento en el archivo de métricas
        """
        timestamp = datetime.now().isoformat()
        
        row = [
            timestamp,
            event,
            session_id,
            user_text or '',
            intent or '',
            confidence or '',
            protocol_id or '',
            step_index or '',
            latency_ms or ''
        ]
        
        try:
            with open(self.metrics_file_path, 'a', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow(row)
        except Exception as e:
            print(f"Error al escribir métricas: {e}")
    
    def log_understand_request(self, session_id: str, user_text: str, intent: str, confidence: float, latency_ms: float):
        """Registrar una solicitud de comprensión (understand)"""
        self.log_event(
            event='understand',
            session_id=session_id,
            user_text=user_text,
            intent=intent,
            confidence=confidence,
            latency_ms=latency_ms
        )
    
    def log_protocol_request(self, session_id: str, protocol_id: str):
        """Registrar una solicitud de protocolo"""
        self.log_event(
            event='protocol',
            session_id=session_id,
            protocol_id=protocol_id
        )
    
    def log_next_step(self, session_id: str, protocol_id: str, step_index: int):
        """Registrar el avance a un siguiente paso"""
        self.log_event(
            event='next_step',
            session_id=session_id,
            protocol_id=protocol_id,
            step_index=step_index
        )
    
    def log_feedback(self, session_id: str, notes: str):
        """Registrar feedback del usuario"""
        self.log_event(
            event='feedback',
            session_id=session_id,
            user_text=notes
        )

# Instancia global del logger de métricas
metrics_file = os.path.join(os.path.dirname(__file__), '..', 'data', 'metrics_log.csv')
metrics_logger = MetricsLogger(metrics_file)
