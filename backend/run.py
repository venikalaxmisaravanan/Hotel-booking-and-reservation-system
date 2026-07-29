"""
run.py
------
Development entry point. `python run.py` starts the Flask dev server.

Creates all tables on first run (if instance/hotel.db does not yet
exist) so a fresh clone works immediately without a separate migration
step -- acceptable for this academic prototype, which uses SQLite with
a fixed, small schema rather than a migrations framework like Alembic.
"""

import os

from app import create_app
from app.extensions import db

app = create_app()

if __name__ == "__main__":
    with app.app_context():
        os.makedirs(app.instance_path, exist_ok=True)
        db.create_all()

    app.run(debug=True, host="0.0.0.0", port=5000)
