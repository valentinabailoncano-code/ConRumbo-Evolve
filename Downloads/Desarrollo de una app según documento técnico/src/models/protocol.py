import json
from pathlib import Path
from typing import Dict, List, Optional


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = PROJECT_ROOT / 'datos'
PROTOCOLS_FILE = DATA_DIR / 'protocols.json'


class Protocol:
    def __init__(self, protocol_id: str, title: str, steps: List[str], meta: Dict[str, object]) -> None:
        self.protocol_id = protocol_id
        self.title = title
        self.steps = steps
        self.meta = meta

    def to_dict(self) -> Dict[str, object]:
        return {
            'protocol_id': self.protocol_id,
            'title': self.title,
            'steps': self.steps,
            'meta': self.meta,
        }


class ProtocolManager:
    def __init__(self, protocols_file_path: Path) -> None:
        self.protocols_file_path = protocols_file_path
        self.protocols = self._load_protocols()

    def _load_protocols(self) -> Dict[str, Protocol]:
        protocols: Dict[str, Protocol] = {}
        if not self.protocols_file_path.exists():
            print(f'Archivo de protocolos no encontrado: {self.protocols_file_path}')
            return protocols

        try:
            with self.protocols_file_path.open('r', encoding='utf-8') as file:
                data = json.load(file)
        except json.JSONDecodeError:
            print(f'Error al decodificar JSON: {self.protocols_file_path}')
            return protocols

        for protocol_id, protocol_data in data.items():
            protocols[protocol_id] = Protocol(
                protocol_id=protocol_id,
                title=protocol_data['title'],
                steps=protocol_data['steps'],
                meta=protocol_data.get('meta', {}),
            )
        return protocols

    def get_protocol(self, protocol_id: str) -> Optional[Protocol]:
        return self.protocols.get(protocol_id)

    def get_all_protocols(self) -> Dict[str, Protocol]:
        return self.protocols

    def search_protocols_by_intent(self, intent: str) -> List[Protocol]:
        intent_mapping = {
            'parada_respiratoria': ['pa_no_respira_v1'],
            'atragantamiento': ['pa_atragantamiento_v1'],
            'hemorragia': ['pa_hemorragia_v1'],
            'inconsciente': ['pa_inconsciente_v1'],
            'convulsiones': ['pa_convulsiones_v1'],
            'quemadura': ['pa_quemadura_v1'],
            'emergencia_general': ['pa_emergencia_general_v1'],
        }

        protocol_ids = intent_mapping.get(intent, [])
        return [self.protocols[pid] for pid in protocol_ids if pid in self.protocols]


protocol_manager = ProtocolManager(PROTOCOLS_FILE)
