import json
import os
from typing import Dict, List, Optional

class Protocol:
    def __init__(self, protocol_id: str, title: str, steps: List[str], meta: Dict):
        self.protocol_id = protocol_id
        self.title = title
        self.steps = steps
        self.meta = meta
    
    def to_dict(self):
        return {
            'protocol_id': self.protocol_id,
            'title': self.title,
            'steps': self.steps,
            'meta': self.meta
        }

class ProtocolManager:
    def __init__(self, protocols_file_path: str):
        self.protocols_file_path = protocols_file_path
        self.protocols = self._load_protocols()
    
    def _load_protocols(self) -> Dict[str, Protocol]:
        """Cargar protocolos desde el archivo JSON"""
        protocols = {}
        try:
            with open(self.protocols_file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                for protocol_id, protocol_data in data.items():
                    protocols[protocol_id] = Protocol(
                        protocol_id=protocol_id,
                        title=protocol_data['title'],
                        steps=protocol_data['steps'],
                        meta=protocol_data['meta']
                    )
        except FileNotFoundError:
            print(f"Archivo de protocolos no encontrado: {self.protocols_file_path}")
        except json.JSONDecodeError:
            print(f"Error al decodificar JSON: {self.protocols_file_path}")
        
        return protocols
    
    def get_protocol(self, protocol_id: str) -> Optional[Protocol]:
        """Obtener un protocolo específico por ID"""
        return self.protocols.get(protocol_id)
    
    def get_all_protocols(self) -> Dict[str, Protocol]:
        """Obtener todos los protocolos"""
        return self.protocols
    
    def search_protocols_by_intent(self, intent: str) -> List[Protocol]:
        """Buscar protocolos basados en la intención detectada"""
        intent_mapping = {
            'parada_respiratoria': ['pa_no_respira_v1'],
            'atragantamiento': ['pa_atragantamiento_v1'],
            'hemorragia': ['pa_hemorragia_v1'],
            'inconsciente': ['pa_inconsciente_v1'],
            'convulsiones': ['pa_convulsiones_v1'],
            'quemadura': ['pa_quemadura_v1']
        }
        
        protocol_ids = intent_mapping.get(intent, [])
        return [self.protocols[pid] for pid in protocol_ids if pid in self.protocols]

# Instancia global del gestor de protocolos
protocols_file = os.path.join(os.path.dirname(__file__), '..', 'data', 'protocols.json')
protocol_manager = ProtocolManager(protocols_file)
