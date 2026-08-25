import uuid
import os
import random
import string
import requests
from flask import Blueprint, request, jsonify
from models import db, Room, User, RoomMovie

room_bp = Blueprint('room', __name__, url_prefix='/api/room')

TMDB_BASE_URL = 'https://api.themoviedb.org/3'

def generate_room_code(length=6):
    """Generate a random uppercase alphanumeric string of fixed length."""
    letters_and_digits = string.ascii_uppercase + string.digits
    return ''.join(random.choice(letters_and_digits) for i in range(length))


def fetch_tmdb_movies(api_key, num_pages=2):
    """Fetch popular movies from TMDB discover endpoint."""
    movies = []
    for page in range(1, num_pages + 1):
        try:
            resp = requests.get(
                f'{TMDB_BASE_URL}/discover/movie',
                params={
                    'api_key': api_key,
                    'sort_by': 'popularity.desc',
                    'include_adult': 'false',
                    'include_video': 'false',
                    'language': 'en-US',
                    'page': page,
                    'vote_count.gte': 100
                },
                timeout=10
            )
            resp.raise_for_status()
            data = resp.json()
            movies.extend(data.get('results', []))
        except requests.RequestException as e:
            print(f"TMDB API error on page {page}: {e}")
    return movies


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
        db.session.flush()  # Get the room ID without committing yet

        # Fetch movies from TMDB and seed them into the room
        api_key = os.environ.get('TMDB_API_KEY')
        if api_key:
            tmdb_movies = fetch_tmdb_movies(api_key)
            for m in tmdb_movies:
                release_date = m.get('release_date', '')
                release_year = int(release_date[:4]) if release_date and len(release_date) >= 4 else None

                room_movie = RoomMovie(
                    room_id=new_room.id,
                    tmdb_id=m.get('id'),
                    title=m.get('title', 'Unknown'),
                    release_year=release_year,
                    poster_path=m.get('poster_path'),
                    overview=m.get('overview', ''),
                    vote_average=m.get('vote_average')
                )
                db.session.add(room_movie)
        
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


@room_bp.route('/<room_code>/movies', methods=['GET'])
def get_room_movies(room_code):
    room = Room.query.filter_by(room_code=room_code.upper()).first()
    
    if not room:
        return jsonify({"error": "Room not found"}), 404
    
    movies = RoomMovie.query.filter_by(room_id=room.id).all()
    return jsonify([m.to_dict() for m in movies]), 200
