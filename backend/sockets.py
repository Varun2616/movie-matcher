from flask import request
from flask_socketio import SocketIO, join_room, emit
from models import db, Room, RoomMovie

# Global socketio instance to be initialized in app.py
socketio = SocketIO()

def register_socket_events(socketio):
    @socketio.on('join_room')
    def handle_join_room(data):
        room_code = data.get('room_code')
        if room_code:
            join_room(room_code.upper())
            print(f"Client {request.sid} joined socket room {room_code}")

    @socketio.on('start_swiping')
    def handle_start_swiping(data):
        room_code = data.get('room_code')
        if room_code:
            room_code = room_code.upper()
            emit('game_started', {'status': 'swiping'}, to=room_code)
            print(f"Broadcasted game_started to room {room_code}")

    @socketio.on('swipe')
    def handle_swipe(data):
        room_code = data.get('room_code')
        movie_id = data.get('movie_id')
        action = data.get('action')

        if not all([room_code, movie_id, action]):
            return

        room = Room.query.filter_by(room_code=room_code.upper()).first()
        if not room:
            return

        movie = RoomMovie.query.filter_by(room_id=room.id, tmdb_id=movie_id).first()
        if not movie:
            return

        if action == 'right':
            movie.score += 1
        elif action == 'veto':
            movie.score -= 1
        # action == 'left' does nothing to score

        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f"Error updating score: {e}")
