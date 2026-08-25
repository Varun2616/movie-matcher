import uuid
import os
import random
import string
import requests
from flask import Blueprint, request, jsonify
from models import db, Room, User, RoomMovie

room_bp = Blueprint('room', __name__, url_prefix='/api/room')

TMDB_BASE_URL = 'https://api.themoviedb.org/3'

# Mapping industry filters to TMDB region/language params
INDUSTRY_TMDB_PARAMS = {
    'hollywood':  {'with_original_language': 'en', 'region': 'US'},
    'bollywood':  {'with_original_language': 'hi', 'region': 'IN'},
    'kollywood':  {'with_original_language': 'ta', 'region': 'IN'},
    'malayalam':  {'with_original_language': 'ml', 'region': 'IN'},
    'tollywood':  {'with_original_language': 'te', 'region': 'IN'},
}


def generate_room_code(length=6):
    """Generate a random uppercase alphanumeric string of fixed length."""
    letters_and_digits = string.ascii_uppercase + string.digits
    return ''.join(random.choice(letters_and_digits) for i in range(length))


def fetch_tmdb_movies(api_key, num_pages=2, industry=None):
    """Fetch popular movies from TMDB discover endpoint, optionally filtered by industry."""
    movies = []
    # Pick random pages between 1 and 10 to ensure a randomized deck
    pages_to_fetch = random.sample(range(1, 11), min(num_pages, 10))
    for page in pages_to_fetch:
        try:
            params = {
                'api_key': api_key,
                'sort_by': 'popularity.desc',
                'include_adult': 'false',
                'include_video': 'false',
                'language': 'en-US',
                'page': page,
                'vote_count.gte': 50
            }
            # Apply industry-specific filters if provided
            if industry and industry in INDUSTRY_TMDB_PARAMS:
                params.update(INDUSTRY_TMDB_PARAMS[industry])

            resp = requests.get(
                f'{TMDB_BASE_URL}/discover/movie',
                params=params,
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
    """Create a room in 'waiting' status. Movies are NOT fetched yet — that happens on /start."""
    while True:
        code = generate_room_code()
        existing_room = Room.query.filter_by(room_code=code).first()
        if not existing_room:
            break
            
    host_session_id = str(uuid.uuid4())
    
    new_room = Room(  # type: ignore
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
    
    new_user = User(  # type: ignore
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


@room_bp.route('/<room_code>/players', methods=['GET'])
def get_room_players(room_code):
    """Return the list of players currently in the room."""
    room = Room.query.filter_by(room_code=room_code.upper()).first()
    if not room:
        return jsonify({"error": "Room not found"}), 404
    
    users = User.query.filter_by(room_id=room.id).all()
    return jsonify({
        "players": [u.to_dict() for u in users],
        "count": len(users)
    }), 200


@room_bp.route('/<room_code>/status', methods=['GET'])
def get_room_status(room_code):
    """Return the current status and settings of the room (for polling)."""
    room = Room.query.filter_by(room_code=room_code.upper()).first()
    if not room:
        return jsonify({"error": "Room not found"}), 404
    
    return jsonify(room.to_dict()), 200


@room_bp.route('/<room_code>/settings', methods=['PUT'])
def update_room_settings(room_code):
    """Host can update room settings while in 'waiting' status."""
    room = Room.query.filter_by(room_code=room_code.upper()).first()
    if not room:
        return jsonify({"error": "Room not found"}), 404

    data = request.get_json()
    host_session_id = data.get('host_session_id')

    if host_session_id != room.host_session_id:
        return jsonify({"error": "Only the host can update settings"}), 403

    if room.status != 'waiting':
        return jsonify({"error": "Cannot change settings after swiping has started"}), 403

    if 'target_recommendations' in data:
        val = data['target_recommendations']
        room.target_recommendations = max(1, min(100, int(val)))
    if 'industry_filter' in data:
        room.industry_filter = data['industry_filter']

    try:
        db.session.commit()
        return jsonify(room.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to update settings", "details": str(e)}), 500


@room_bp.route('/<room_code>/start', methods=['POST'])
def start_room(room_code):
    """Host triggers the start of swiping. This fetches movies from TMDB and changes status to 'swiping'."""
    room = Room.query.filter_by(room_code=room_code.upper()).first()
    if not room:
        return jsonify({"error": "Room not found"}), 404

    data = request.get_json() or {}
    host_session_id = data.get('host_session_id')

    if host_session_id != room.host_session_id:
        return jsonify({"error": "Only the host can start the room"}), 403

    if room.status != 'waiting':
        return jsonify({"error": "Room has already started"}), 400

    try:
        # Fetch movies from TMDB based on industry filters
        api_key = os.environ.get('TMDB_API_KEY')
        if api_key:
            industries = [i.strip() for i in room.industry_filter.split(',') if i.strip()]
            
            if industries:
                # Fetch movies for each selected industry
                all_movies = []
                seen_ids = set()
                pages_per_industry = max(1, 3 // len(industries))  # Distribute pages across industries
                for ind in industries:
                    fetched = fetch_tmdb_movies(api_key, num_pages=pages_per_industry, industry=ind)
                    for m in fetched:
                        if m['id'] not in seen_ids:
                            all_movies.append(m)
                            seen_ids.add(m['id'])
            else:
                # Default: popular movies globally
                all_movies = fetch_tmdb_movies(api_key, num_pages=2)

            # Shuffle the fetched movies to randomize the deck
            random.shuffle(all_movies)

            # Limit the total number of fetched/saved movies to the host's configured target_recommendations
            all_movies = all_movies[:room.target_recommendations]

            # Insert movies into the room
            for m in all_movies:
                release_date = m.get('release_date', '')
                release_year = int(release_date[:4]) if release_date and len(release_date) >= 4 else None

                room_movie = RoomMovie(  # type: ignore
                    room_id=room.id,
                    tmdb_id=m.get('id'),
                    title=m.get('title', 'Unknown'),
                    release_year=release_year,
                    poster_path=m.get('poster_path'),
                    overview=m.get('overview', ''),
                    vote_average=m.get('vote_average')
                )
                db.session.add(room_movie)

        room.status = 'swiping'
        db.session.commit()
        return jsonify({"status": "swiping", "message": "Room started! Movies loaded."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to start room", "details": str(e)}), 500


@room_bp.route('/<room_code>/movies', methods=['GET'])
def get_room_movies(room_code):
    room = Room.query.filter_by(room_code=room_code.upper()).first()
    
    if not room:
        return jsonify({"error": "Room not found"}), 404
    
    movies = RoomMovie.query.filter_by(room_id=room.id).all()
    return jsonify([m.to_dict() for m in movies]), 200


@room_bp.route('/<room_code>/leaderboard', methods=['GET'])
def get_leaderboard(room_code):
    room = Room.query.filter_by(room_code=room_code.upper()).first()
    
    if not room:
        return jsonify({"error": "Room not found"}), 404
        
    # Get all movies in the flashcard deck for that room, sorted by score descending
    movies = RoomMovie.query.filter_by(room_id=room.id)\
        .order_by(RoomMovie.score.desc()).all()
        
    return jsonify([m.to_dict() for m in movies]), 200
