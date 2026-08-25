from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Room(db.Model):
    __tablename__ = 'rooms'
    
    id = db.Column(db.Integer, primary_key=True)
    room_code = db.Column(db.String(6), unique=True, index=True, nullable=False)
    host_session_id = db.Column(db.String(36), nullable=False)
    status = db.Column(db.String(20), default='waiting', nullable=False)
    target_recommendations = db.Column(db.Integer, default=10, nullable=False)
    industry_filter = db.Column(db.String(255), default='', nullable=False)  # Comma-separated: "hollywood,bollywood"
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationship to User
    users = db.relationship('User', backref='room', lazy=True, cascade="all, delete-orphan")
    # Relationship to RoomMovie
    movies = db.relationship('RoomMovie', backref='room', lazy=True, cascade="all, delete-orphan")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            'id': self.id,
            'room_code': self.room_code,
            'host_session_id': self.host_session_id,
            'status': self.status,
            'target_recommendations': self.target_recommendations,
            'industry_filter': self.industry_filter,
            'created_at': self.created_at.isoformat()
        }


class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(36), unique=True, nullable=False)
    display_name = db.Column(db.String(50), nullable=False)
    room_id = db.Column(db.Integer, db.ForeignKey('rooms.id'), nullable=False)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'display_name': self.display_name,
            'room_id': self.room_id,
            'joined_at': self.joined_at.isoformat()
        }


class RoomMovie(db.Model):
    __tablename__ = 'room_movies'

    id = db.Column(db.Integer, primary_key=True)
    room_id = db.Column(db.Integer, db.ForeignKey('rooms.id'), nullable=False)
    tmdb_id = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String(255), nullable=False)
    release_year = db.Column(db.Integer)
    poster_path = db.Column(db.String(255))
    overview = db.Column(db.Text)
    vote_average = db.Column(db.Float)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            'id': self.id,
            'tmdb_id': self.tmdb_id,
            'title': self.title,
            'year': self.release_year,
            'poster_path': self.poster_path,
            'thumbnail': f"https://image.tmdb.org/t/p/w780{self.poster_path}" if self.poster_path else None,
            'overview': self.overview,
            'vote_average': self.vote_average,
            'cast': [],
            'whereToWatch': []
        }
