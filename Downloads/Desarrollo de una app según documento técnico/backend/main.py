import os
import sys
from pathlib import Path

# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from src.models.user import db
from src.routes.user import user_bp
from src.routes.conrumbo import conrumbo_bp

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR.parent / 'frontend'
DATABASE_DIR = BASE_DIR / 'database'
DATABASE_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DATABASE_DIR / 'app.db'

app = Flask(
    __name__,
    static_folder=str(FRONTEND_DIR),
    static_url_path='',
)
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{DB_PATH}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

CORS(app)

app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(conrumbo_bp, url_prefix='/api')

db.init_app(app)
with app.app_context():
    db.create_all()


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path: str):
    if path:
        target_path = FRONTEND_DIR / path
        if target_path.exists() and target_path.is_file():
            return send_from_directory(FRONTEND_DIR, path)

    index_path = FRONTEND_DIR / 'index.html'
    if index_path.exists():
        return send_from_directory(FRONTEND_DIR, 'index.html')

    return 'index.html not found', 404


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
