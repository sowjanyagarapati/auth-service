import os
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from utils import hashing
import random

from database import get_all_users, get_user_by_email, create_user

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserInput(BaseModel):
    name: str = None
    email: str
    password: str = None

def get_current_user(request: Request):
    token = request.headers.get('Authorization')
    if not token:
        raise HTTPException(status_code=401, detail="No token provided")
    token = token.split(' ')[1]
    try:
        user = hashing.decode_jwt(token)
        return user.get("user")
    except:
        raise HTTPException(status_code=401, detail="Invalid token")
    
@app.get("/")
def read_root():
    return {"message": "Welcome to auth-service"}

@app.get("/users")
def get_users():
    try:
        users = get_all_users()
        return users
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error fetching users " + str(e))

@app.post("/users/create")
def create_new_user(user: UserInput):
    try:
        exists = get_user_by_email(user.email)
        if exists:
            return {"message": "User already exists"}
        
        result = create_user(user.dict())
        if result:
            return {"message": "User created successfully"}
        else:
            return {"message": "Error creating user"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error creating user " + str(e))

@app.post("/login")
def login(user: UserInput):
    try:
        exists = get_user_by_email(user.email)
        if not exists:
            return {"message": "Invalid credentials"}
        password = hashing.verify_password(user.password, exists['password'])
        if password:
            token = hashing.generate_jwt(exists['name'])
            return {"token": token, "message": "Login successful"}
        else:
            return {"message": "Invalid credentials"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error during login " + str(e))

@app.get("/random")
def get_random_number(current_user: str = Depends(get_current_user)):
    try:
        return {"summary" :f"Hey {current_user}! Your random number is {random.randint(1, 100)}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error fetching random number " + str(e))
