"""
app/extensions.py
------------------
Flask extension objects are instantiated here, *without* being bound to an
app yet. They are bound later inside the application factory
(app/__init__.py) via `extension.init_app(app)`.

Why this file exists:
Models, services, and routes all need access to `db` (SQLAlchemy) and
`bcrypt`. If we instantiated these directly inside `app/__init__.py`,
every module that needs them would have to import from the factory
module, which creates circular imports as soon as the factory imports
those same modules to register them. Keeping a single, import-free
"extensions" module breaks the cycle.
"""

from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_jwt_extended import JWTManager

db = SQLAlchemy()
bcrypt = Bcrypt()
cors = CORS()
jwt = JWTManager()
