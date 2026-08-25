from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Room(db.Model):
    __tablename__ = 'rooms'
    
    id = db.Column(db.Integer, primary_key=True)
    room_code = db.Column(db.String(6), unique=True, index=True, nullable=False)
    host_session_id = db.Column(db.String(36), nullable=False)
    status = db.Column(db.String(20), default='waiting', nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationship to User
    users = db.relationship('User', backref='room', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'room_code': self.room_code,
            'host_session_id': self.host_session_id,
            'status': self.status,
            'created_at': self.created_at.isoformat()
        }


class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(36), unique=True, nullable=False)
    display_name = db.Column(db.String(50), nullable=False)
    room_id = db.Column(db.Integer, db.ForeignKey('rooms.id'), nullable=False)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'display_name': self.display_name,
            'room_id': self.room_id,
            'joined_at': self.joined_at.isoformat()
        }
