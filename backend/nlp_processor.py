import re
from typing import Dict, Tuple
from datetime import datetime

class NLPProcessor:
    def __init__(self):
        # Palabras clave para detectar diferentes tipos de emergencias
        self.intent_keywords = {
            'parada_respiratoria': [
                'no respira', 'no está respirando', 'dejó de respirar', 'parada respiratoria',
                'no puede respirar', 'sin respiración', 'respiración', 'respira'
            ],
            'atragantamiento': [
                'se atraganta', 'atragantamiento', 'no puede respirar por comida',
                'algo en la garganta', 'ahogándose', 'comida atascada', 'atraganta'
            ],
            'hemorragia': [
                'sangra', 'sangrando', 'hemorragia', 'mucha sangre', 'sangre',
                'herida sangrante', 'corte profundo', 'pérdida de sangre'
            ],
            'inconsciente': [
                'inconsciente', 'no responde', 'se desmayó', 'perdió el conocimiento',
                'no reacciona', 'desmayo', 'sin conocimiento', 'no despierta'
            ],
            'convulsiones': [
                'convulsiones', 'convulsionando', 'temblores', 'espasmos',
                'ataque epiléptico', 'se convulsiona', 'movimientos involuntarios'
            ],
            'quemadura': [
                'quemadura', 'quemado', 'se quemó', 'fuego', 'calor',
                'agua caliente', 'aceite caliente', 'quemaduras'
            ]
        }
        
        # Sinónimos y variaciones comunes
        self.synonyms = {
            'ayuda': ['auxilio', 'socorro', 'emergencia', 'urgencia'],
            'emergencia': ['urgencia', 'crisis', 'problema grave'],
            'no respira': ['sin aire', 'no puede respirar', 'falta de aire']
        }
    
    def normalize_text(self, text: str) -> str:
        """Normalizar el texto de entrada"""
        # Convertir a minúsculas
        text = text.lower().strip()
        
        # Remover caracteres especiales pero mantener espacios y acentos
        text = re.sub(r'[^\w\sáéíóúñü]', '', text)
        
        # Normalizar espacios múltiples
        text = re.sub(r'\s+', ' ', text)
        
        return text
    
    def detect_intent(self, text: str) -> Tuple[str, float]:
        """
        Detectar la intención del usuario basada en el texto
        Retorna: (intent, confidence)
        """
        normalized_text = self.normalize_text(text)
        
        intent_scores = {}
        
        # Calcular puntuaciones para cada intención
        for intent, keywords in self.intent_keywords.items():
            score = 0
            for keyword in keywords:
                if keyword.lower() in normalized_text:
                    # Puntuación más alta para coincidencias exactas
                    if keyword.lower() == normalized_text:
                        score += 1.0
                    else:
                        score += 0.7
                    
                    # Bonus por palabras múltiples
                    if len(keyword.split()) > 1:
                        score += 0.2
            
            if score > 0:
                intent_scores[intent] = score
        
        # Si no hay coincidencias, intentar con sinónimos
        if not intent_scores:
            for synonym_group in self.synonyms.values():
                for synonym in synonym_group:
                    if synonym in normalized_text:
                        # Retornar intención genérica con baja confianza
                        return 'emergencia_general', 0.3
        
        # Seleccionar la intención con mayor puntuación
        if intent_scores:
            best_intent = max(intent_scores, key=intent_scores.get)
            max_score = intent_scores[best_intent]
            
            # Normalizar la confianza (máximo 1.0)
            confidence = min(max_score, 1.0)
            
            return best_intent, confidence
        
        # Sin intención detectada
        return 'unknown', 0.0
    
    def process_utterance(self, utterance: str, session_id: str) -> Dict:
        """
        Procesar una expresión del usuario
        Retorna un diccionario con la intención y confianza
        """
        intent, confidence = self.detect_intent(utterance)
        
        return {
            'intent': intent,
            'confidence': confidence,
            'session_id': session_id,
            'timestamp': datetime.now().isoformat(),
            'original_text': utterance,
            'normalized_text': self.normalize_text(utterance)
        }

# Instancia global del procesador NLP
nlp_processor = NLPProcessor()
