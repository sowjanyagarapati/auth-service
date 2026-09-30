from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta
import os

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def encrypt(password):
    return pwd_context.hash(password)

def verify_password(password, hashed_pw):
    return pwd_context.verify(password, hashed_pw)

def generate_jwt(user):
    payload = {
        "user": user,
        "exp": datetime.utcnow() + timedelta(minutes=1)
    }
    return jwt.encode(payload, os.environ.get('JWT_SECRET'), algorithm='HS256')

def decode_jwt(token):
    return jwt.decode(token, os.environ.get('JWT_SECRET'), algorithms=['HS256'])