import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

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
        if exists['password'] == user.password and exists['email'] == user.email:
            return {"message": "Login successful"}
        else:
            return {"message": "Invalid credentials"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error during login " + str(e))
