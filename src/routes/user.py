from flask import Blueprint, jsonify, request
from sqlalchemy.exc import IntegrityError

from src.models.user import User, db


user_bp = Blueprint('user', __name__)


@user_bp.route('/users', methods=['GET'])
def get_users():
    users = User.query.order_by(User.id).all()
    return jsonify([user.to_dict() for user in users]), 200


@user_bp.route('/users', methods=['POST'])
def create_user():
    data = request.get_json(silent=True) or {}
    username = data.get('username')
    email = data.get('email')

    if not username or not email:
        return jsonify({'error': "Campos 'username' y 'email' requeridos"}), 400

    try:
        user = User(username=username, email=email)
        db.session.add(user)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Usuario o email ya existe'}), 409

    return jsonify(user.to_dict()), 201


@user_bp.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id: int):
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict()), 200


@user_bp.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id: int):
    user = User.query.get_or_404(user_id)
    data = request.get_json(silent=True) or {}

    username = data.get('username', user.username)
    email = data.get('email', user.email)

    user.username = username
    user.email = email

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Usuario o email ya existe'}), 409

    return jsonify(user.to_dict()), 200


@user_bp.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id: int):
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return '', 204
