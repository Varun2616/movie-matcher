from flask import request
from flask_socketio import SocketIO, join_room, emit
from models import db, Room, RoomMovie, User

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
        try:
            movie_id = int(data.get('movie_id'))
        except (TypeError, ValueError):
            movie_id = None
            
        action = data.get('action')

        if not all([room_code, movie_id, action]):
            return

        room = Room.query.filter_by(room_code=room_code.upper()).first()
        if not room:
            return

        movie = RoomMovie.query.filter_by(id=movie_id).first()
        if not movie or movie.room_id != room.id:
            return

        if action == 'right':
            movie.score += 1
        elif action == 'veto':
            movie.score -= 1
        # action == 'left' does nothing to score

        try:
            db.session.add(movie)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f"Error updating score: {e}")

    @socketio.on('deck_empty')
    def handle_deck_empty(data):
        room_code = data.get('room_code')
        session_id = data.get('session_id')

        if not room_code or not session_id:
            return

        room = Room.query.filter_by(room_code=room_code.upper()).first()
        if not room:
            return

        user = User.query.filter_by(session_id=session_id, room_id=room.id).first()
        if user:
            user.is_finished = True
            
            try:
                db.session.commit()
            except Exception as e:
                db.session.rollback()
                print(f"Error updating user finished state: {e}")
                return
                
            total_users_count = User.query.filter_by(room_id=room.id).count()
            finished_users_count = User.query.filter_by(room_id=room.id, is_finished=True).count()
            
            if total_users_count > 0 and finished_users_count >= total_users_count:
                emit('show_leaderboard', to=room.room_code.upper())
                print(f"Broadcasted show_leaderboard to room {room_code}")

    @socketio.on('return_to_lobby')
    def handle_return_to_lobby(data):
        room_code = data.get('room_code')
        if not room_code:
            return
            
        room = Room.query.filter_by(room_code=room_code.upper()).first()
        if not room:
            return
            
        # Reset room status
        room.status = 'waiting'
        
        # Reset users is_finished
        users = User.query.filter_by(room_id=room.id).all()
        for u in users:
            u.is_finished = False
            
        # Clear RoomMovie records
        RoomMovie.query.filter_by(room_id=room.id).delete()
        
        try:
            db.session.commit()
            emit('lobby_restarted', to=room.room_code.upper())
            print(f"Broadcasted lobby_restarted to room {room_code}")
        except Exception as e:
            db.session.rollback()
            print(f"Error resetting to lobby: {e}")

    @socketio.on('start_tiebreaker')
    def handle_start_tiebreaker(data):
        room_code = data.get('room_code')
        if not room_code:
            return
            
        room = Room.query.filter_by(room_code=room_code.upper()).first()
        if not room:
            return
            
        # Find maximum score
        movies = RoomMovie.query.filter_by(room_id=room.id).all()
        if not movies:
            return
            
        max_score = max(m.score for m in movies)
        
        # Keep only tied movies, set score to 0
        for m in movies:
            if m.score < max_score:
                db.session.delete(m)
            else:
                m.score = 0
                
        # Set room status to tiebreaker
        room.status = 'tiebreaker'
        
        # Reset user finished states
        users = User.query.filter_by(room_id=room.id).all()
        for u in users:
            u.is_finished = False
            
        try:
            db.session.commit()
            emit('tiebreaker_started', {'status': 'tiebreaker'}, to=room.room_code.upper())
            print(f"Broadcasted tiebreaker_started to room {room_code}")
        except Exception as e:
            db.session.rollback()
            print(f"Error starting tiebreaker: {e}")
