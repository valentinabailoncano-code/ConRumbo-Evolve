import time
import uuid
from flask import Blueprint, jsonify, request

from src.models.nlp_processor import nlp_processor
from src.models.protocol import protocol_manager
from src.models.metrics import metrics_logger


conrumbo_bp = Blueprint('conrumbo', __name__)


@conrumbo_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({'ok': True}), 200


@conrumbo_bp.route('/understand', methods=['POST'])
def understand():
    start_time = time.time()

    data = request.get_json(silent=True) or {}
    utterance = data.get('utterance')
    if not utterance:
        return jsonify({'error': "Campo 'utterance' requerido"}), 400

    session_id = data.get('session_id', str(uuid.uuid4()))

    result = nlp_processor.process_utterance(utterance, session_id)
    protocols = protocol_manager.search_protocols_by_intent(result['intent'])
    protocol_id = protocols[0].protocol_id if protocols else None

    latency_ms = (time.time() - start_time) * 1000
    metrics_logger.log_understand_request(
        session_id=session_id,
        user_text=utterance,
        intent=result['intent'],
        confidence=result['confidence'],
        latency_ms=latency_ms,
    )

    return (
        jsonify(
            {
                'intent': result['intent'],
                'confidence': result['confidence'],
                'protocol_id': protocol_id,
            }
        ),
        200,
    )


@conrumbo_bp.route('/protocol', methods=['POST'])
def get_protocol():
    data = request.get_json(silent=True) or {}
    protocol_id = data.get('protocol_id')
    if not protocol_id:
        return jsonify({'error': "Campo 'protocol_id' requerido"}), 400

    session_id = data.get('session_id', str(uuid.uuid4()))
    protocol = protocol_manager.get_protocol(protocol_id)
    if not protocol:
        return jsonify({'error': 'Protocolo no encontrado'}), 404

    metrics_logger.log_protocol_request(session_id, protocol_id)
    return jsonify({'title': protocol.title, 'steps': protocol.steps}), 200


@conrumbo_bp.route('/next_step', methods=['POST'])
def next_step():
    data = request.get_json(silent=True) or {}
    protocol_id = data.get('protocol_id')
    current_step = data.get('current_step')

    if protocol_id is None or current_step is None:
        return jsonify({'error': "Campos 'protocol_id' y 'current_step' requeridos"}), 400

    if not isinstance(current_step, int) or current_step < -1:
        return jsonify({'error': "El campo 'current_step' debe ser un entero >= -1"}), 400

    session_id = data.get('session_id', str(uuid.uuid4()))
    protocol = protocol_manager.get_protocol(protocol_id)
    if not protocol:
        return jsonify({'error': 'Protocolo no encontrado'}), 404

    total_steps = len(protocol.steps)
    next_step_index = current_step + 1

    if next_step_index >= total_steps:
        response = {
            'done': True,
            'step': '',
            'step_index': total_steps,
            'total_steps': total_steps,
            'title': protocol.title,
        }
    else:
        response = {
            'done': False,
            'step': protocol.steps[next_step_index],
            'step_index': next_step_index,
            'total_steps': total_steps,
            'title': protocol.title,
        }

    metrics_logger.log_next_step(session_id, protocol_id, next_step_index)
    return jsonify(response), 200


@conrumbo_bp.route('/feedback', methods=['POST'])
def feedback():
    data = request.get_json(silent=True) or {}
    session_id = data.get('session_id')
    if not session_id:
        return jsonify({'error': "Campo 'session_id' requerido"}), 400

    notes = data.get('notes', '')
    metrics_logger.log_feedback(session_id, notes)
    return jsonify({'ok': True}), 200


@conrumbo_bp.route('/protocols', methods=['GET'])
def get_all_protocols():
    protocols = {
        protocol_id: protocol.to_dict()
        for protocol_id, protocol in protocol_manager.get_all_protocols().items()
    }
    return jsonify(protocols), 200
