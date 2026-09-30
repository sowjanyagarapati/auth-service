from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta
import os

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def encrypt(password):
    return pwd_context.hash(password)

def verify_password(password, hashed_pw):
    return pwd_context.verify(password, hashed_pw)

def generate_access_token(user):
    payload = {
        "user": user,
        "type": "access",
        "exp": datetime.utcnow() + timedelta(minutes=1) #short-lived access token
    }
    return jwt.encode(payload, os.environ.get('JWT_SECRET'), algorithm='HS256')

def generate_refresh_token(user):
    payload = {
        "user": user,
        "type": "refresh",
        "exp": datetime.utcnow() + timedelta(minutes=2) #long-lived refresh token
    }
    return jwt.encode(payload, os.environ.get('JWT_REFRESH_SECRET'), algorithm='HS256')

def decode_jwt(token, secret=os.environ.get('JWT_SECRET')):
    return jwt.decode(token, secret, algorithms=['HS256'])