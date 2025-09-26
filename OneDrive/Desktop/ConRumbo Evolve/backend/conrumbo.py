from flask import Blueprint, jsonify, request
import time
import uuid
from src.models.nlp_processor import nlp_processor
from src.models.protocol import protocol_manager
from src.models.metrics import metrics_logger

conrumbo_bp = Blueprint('conrumbo', __name__)

@conrumbo_bp.route('/health', methods=['GET'])
def health_check():
    """Endpoint de verificación de estado"""
    return jsonify({"ok": True}), 200

@conrumbo_bp.route('/understand', methods=['POST'])
def understand():
    """
    Procesar texto del usuario y detectar intención
    Request: {"utterance": "no respira", "lang": "es", "session_id": "uuid"}
    Response: {"intent": "parada_respiratoria", "confidence": 0.92, "protocol_id": "pa_no_respira_v1"}
    """
    start_time = time.time()
    
    try:
        data = request.get_json()
        
        if not data or 'utterance' not in data:
            return jsonify({"error": "Campo 'utterance' requerido"}), 400
        
        utterance = data['utterance']
        session_id = data.get('session_id', str(uuid.uuid4()))
        lang = data.get('lang', 'es')
        
        # Procesar la expresión con NLP
        result = nlp_processor.process_utterance(utterance, session_id)
        
        # Buscar protocolo correspondiente
        protocols = protocol_manager.search_protocols_by_intent(result['intent'])
        protocol_id = protocols[0].protocol_id if protocols else None
        
        # Calcular latencia
        latency_ms = (time.time() - start_time) * 1000
        
        # Registrar métricas
        metrics_logger.log_understand_request(
            session_id=session_id,
            user_text=utterance,
            intent=result['intent'],
            confidence=result['confidence'],
            latency_ms=latency_ms
        )
        
        response = {
            "intent": result['intent'],
            "confidence": result['confidence'],
            "protocol_id": protocol_id
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@conrumbo_bp.route('/protocol', methods=['POST'])
def get_protocol():
    """
    Obtener un protocolo específico
    Request: {"protocol_id": "pa_no_respira_v1"}
    Response: {"title": "Parada respiratoria (adulto)", "steps": ["...", "..."]}
    """
    try:
        data = request.get_json()
        
        if not data or 'protocol_id' not in data:
            return jsonify({"error": "Campo 'protocol_id' requerido"}), 400
        
        protocol_id = data['protocol_id']
        session_id = data.get('session_id', str(uuid.uuid4()))
        
        # Buscar el protocolo
        protocol = protocol_manager.get_protocol(protocol_id)
        
        if not protocol:
            return jsonify({"error": "Protocolo no encontrado"}), 404
        
        # Registrar métricas
        metrics_logger.log_protocol_request(session_id, protocol_id)
        
        response = {
            "title": protocol.title,
            "steps": protocol.steps
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@conrumbo_bp.route('/next_step', methods=['POST'])
def next_step():
    """
    Avanzar al siguiente paso en un protocolo
    Request: {"protocol_id": "pa_no_respira_v1", "current_step": 0, "session_id": "uuid"}
    Response: {"done": false, "step": "...", "step_index": 1, "total_steps": 8, "title": "..."}
    """
    try:
        data = request.get_json()
        
        required_fields = ['protocol_id', 'current_step']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Campo '{field}' requerido"}), 400
        
        protocol_id = data['protocol_id']
        current_step = data['current_step']
        session_id = data.get('session_id', str(uuid.uuid4()))
        
        # Buscar el protocolo
        protocol = protocol_manager.get_protocol(protocol_id)
        
        if not protocol:
            return jsonify({"error": "Protocolo no encontrado"}), 404
        
        # Calcular el siguiente paso
        next_step_index = current_step + 1
        total_steps = len(protocol.steps)
        
        # Verificar si hemos terminado
        if next_step_index >= total_steps:
            response = {
                "done": True,
                "step": "",
                "step_index": total_steps,
                "total_steps": total_steps,
                "title": protocol.title
            }
        else:
            response = {
                "done": False,
                "step": protocol.steps[next_step_index],
                "step_index": next_step_index,
                "total_steps": total_steps,
                "title": protocol.title
            }
        
        # Registrar métricas
        metrics_logger.log_next_step(session_id, protocol_id, next_step_index)
        
        return jsonify(response), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@conrumbo_bp.route('/feedback', methods=['POST'])
def feedback():
    """
    Recibir feedback del usuario
    Request: {"session_id": "uuid", "notes": "instrucciones claras, tardé 12s"}
    Response: {"ok": true}
    """
    try:
        data = request.get_json()
        
        if not data or 'session_id' not in data:
            return jsonify({"error": "Campo 'session_id' requerido"}), 400
        
        session_id = data['session_id']
        notes = data.get('notes', '')
        
        # Registrar feedback
        metrics_logger.log_feedback(session_id, notes)
        
        return jsonify({"ok": True}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Endpoint adicional para obtener todos los protocolos (útil para desarrollo)
@conrumbo_bp.route('/protocols', methods=['GET'])
def get_all_protocols():
    """Obtener todos los protocolos disponibles"""
    try:
        protocols = protocol_manager.get_all_protocols()
        
        response = {}
        for protocol_id, protocol in protocols.items():
            response[protocol_id] = protocol.to_dict()
        
        return jsonify(response), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
