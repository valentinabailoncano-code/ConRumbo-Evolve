import re
import unicodedata
from datetime import datetime
from typing import Dict, Tuple


class NLPProcessor:
    def __init__(self) -> None:
        # Keywords grouped by intent for a lightweight rule-based matcher
        self.intent_keywords = {
            'parada_respiratoria': [
                'no respira', 'no esta respirando', 'dejo de respirar', 'parada respiratoria',
                'no puede respirar', 'sin respiracion'
            ],
            'atragantamiento': [
                'se atraganta', 'atragantamiento', 'no puede tragar', 'algo en la garganta',
                'se ahoga', 'comida atascada'
            ],
            'hemorragia': [
                'sangra', 'sangrando', 'hemorragia', 'mucha sangre', 'sangre abundante',
                'herida sangrante', 'corte profundo'
            ],
            'inconsciente': [
                'inconsciente', 'no responde', 'se desmayo', 'perdio el conocimiento',
                'no reacciona', 'desmayo', 'sin conocimiento', 'no despierta'
            ],
            'convulsiones': [
                'convulsiones', 'convulsionando', 'temblores', 'espasmos', 'ataque epileptico',
                'se convulsiona', 'movimientos involuntarios'
            ],
            'quemadura': [
                'quemadura', 'quemado', 'se quemo', 'fuego', 'calor extremo',
                'agua caliente', 'aceite caliente', 'quemaduras'
            ]
        }

        self.synonyms = {
            'ayuda': ['auxilio', 'socorro', 'emergencia', 'urgencia'],
            'emergencia': ['crisis', 'problema grave'],
            'no respira': ['sin aire', 'no puede respirar', 'falta de aire']
        }

    @staticmethod
    def _strip_accents(text: str) -> str:
        return ''.join(
            char for char in unicodedata.normalize('NFKD', text)
            if unicodedata.category(char) != 'Mn'
        )

    def normalize_text(self, text: str) -> str:
        text = self._strip_accents(text.lower().strip())
        text = re.sub(r'[^a-z0-9\s]', ' ', text)
        return re.sub(r'\s+', ' ', text).strip()

    def detect_intent(self, text: str) -> Tuple[str, float]:
        normalized_text = self.normalize_text(text)
        intent_scores: Dict[str, float] = {}

        for intent, keywords in self.intent_keywords.items():
            score = 0.0
            for keyword in keywords:
                if keyword in normalized_text:
                    score += 1.0 if keyword == normalized_text else 0.7
                    if ' ' in keyword:
                        score += 0.2
            if score > 0:
                intent_scores[intent] = score

        if not intent_scores:
            for synonym_group in self.synonyms.values():
                for synonym in synonym_group:
                    if synonym in normalized_text:
                        return 'emergencia_general', 0.3

        if intent_scores:
            best_intent = max(intent_scores, key=intent_scores.get)
            confidence = min(intent_scores[best_intent], 1.0)
            return best_intent, confidence

        return 'unknown', 0.0

    def process_utterance(self, utterance: str, session_id: str) -> Dict[str, object]:
        intent, confidence = self.detect_intent(utterance)
        return {
            'intent': intent,
            'confidence': confidence,
            'session_id': session_id,
            'timestamp': datetime.now().isoformat(),
            'original_text': utterance,
            'normalized_text': self.normalize_text(utterance)
        }


nlp_processor = NLPProcessor()
