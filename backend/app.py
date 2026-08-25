import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from models import db
from routes.room import room_bp
from sockets import socketio, register_socket_events

# Load environment variables
load_dotenv()

def create_app():
    app = Flask(__name__)
    
    # Enable CORS for the frontend Vite server
    CORS(app)
    
    # Configure the SQLAlchemy database URL
    # Format: postgresql://username:password@localhost/dbname
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize plugins
    db.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*", async_mode='gevent')
    register_socket_events(socketio)
    
    # Register Blueprints
    app.register_blueprint(room_bp)
    
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({"status": "healthy", "service": "movie-matcher-api"}), 200

    # Create tables if they don't exist
    with app.app_context():
        try:
            db.create_all()
            print("Database tables created successfully!")
        except Exception as e:
            print(f"Error creating database tables: {e}")
            
    return app

if __name__ == '__main__':
    app = create_app()
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
