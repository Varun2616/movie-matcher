import uuid
import random
import string
from flask import Blueprint, request, jsonify
from models import db, Room, User

room_bp = Blueprint('room', __name__, url_prefix='/api/room')

def generate_room_code(length=6):
    """Generate a random uppercase alphanumeric string of fixed length."""
    letters_and_digits = string.ascii_uppercase + string.digits
    return ''.join(random.choice(letters_and_digits) for i in range(length))

@room_bp.route('/create', methods=['POST'])
def create_room():
    # Generate a unique room code
    while True:
        code = generate_room_code()
        existing_room = Room.query.filter_by(room_code=code).first()
        if not existing_room:
            break
            
    host_session_id = str(uuid.uuid4())
    
    new_room = Room(
        room_code=code,
        host_session_id=host_session_id,
        status='waiting'
    )
    
    try:
        db.session.add(new_room)
        db.session.commit()
        return jsonify({
            "room_code": code,
            "host_session_id": host_session_id,
            "message": "Room created successfully"
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to create room", "details": str(e)}), 500


@room_bp.route('/join', methods=['POST'])
def join_room():
    data = request.get_json()
    
    if not data or not data.get('room_code') or not data.get('display_name'):
        return jsonify({"error": "Missing room_code or display_name"}), 400
        
    room_code = data['room_code'].upper()
    display_name = data['display_name']
    
    room = Room.query.filter_by(room_code=room_code).first()
    
    if not room:
        return jsonify({"error": "Room not found"}), 404
        
    if room.status != 'waiting':
        return jsonify({"error": "Cannot join a room that is currently in progress"}), 403
        
    user_session_id = str(uuid.uuid4())
    
    new_user = User(
        session_id=user_session_id,
        display_name=display_name,
        room_id=room.id
    )
    
    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({
            "status": "success",
            "session_id": user_session_id,
            "display_name": display_name,
            "room_code": room_code,
            "message": "Successfully joined the room"
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to join room", "details": str(e)}), 500
