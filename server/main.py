import os
from fastapi import FastAPI, HTTPException, Request, Depends, Response, Cookie
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from utils import hashing
import random
import httpx

from database import get_all_users, get_user_by_email, create_user

load_dotenv()

app = FastAPI()

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = "http://localhost:5000/auth/google/callback"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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
        user = hashing.decode_jwt(token,os.environ.get('JWT_SECRET'))
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
def login(user: UserInput, response: Response):
    try:
        exists = get_user_by_email(user.email)
        if not exists:
            return {"message": "Invalid credentials"}
        password = hashing.verify_password(user.password, exists['password'])
        if password:
            access_token = hashing.generate_access_token(exists['name'])
            refresh_token = hashing.generate_refresh_token(exists['name'])
            response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, samesite="lax", secure=False)
            return {"access_token": access_token, "message": "Login successful"}
        else:
            return {"message": "Invalid credentials"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error during login " + str(e))


@app.post("/refresh")
def refresh_token(refresh_token: str = Cookie(None)):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token missing")
    try:
        payload = hashing.decode_jwt(refresh_token, os.environ.get('JWT_REFRESH_SECRET'))
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
            
        # Issue a new access token for the user
        new_access_token = hashing.generate_access_token(payload.get("user"))
        return {"access_token": new_access_token}
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

@app.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="refresh_token", httponly=True, samesite="lax")
    return {"message": "Logged out successfully"}

    
@app.get("/random")
def get_random_number(current_user: str = Depends(get_current_user)):
    try:
        return {"summary" :f"Hey {current_user}! Your random number is {random.randint(1, 100)}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error fetching random number " + str(e))

# 1. Initiates the OAuth Flow
@app.get("/auth/google/login")
def google_login():
    google_auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"response_type=code&client_id={GOOGLE_CLIENT_ID}"
        f"&redirect_uri={REDIRECT_URI}&scope=openid%20email%20profile"
        f"&prompt=select_account"
    )
    return RedirectResponse(google_auth_url)
    
# 2. Handles the Callback from Google
@app.get("/auth/google/callback")
async def google_callback(code: str, response: Response):
    # A. Exchange code for Google Access Token
    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )
        token_data = token_res.json()
        google_access_token = token_data.get("access_token")
        # B. Fetch User Info from Google
        user_info_res = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {google_access_token}"},
        )
        user_info = user_info_res.json()
    user_email = user_info.get("email")
    user_name = user_info.get("name")
    # C. Find or Create User in PostgreSQL DB
    exists = get_user_by_email(user_email)
    if not exists:
        create_user({"name": user_name, "email": user_email, "password": ""})
    # D. Issue YOUR App's JWT & HttpOnly Refresh Cookie
    access_token = hashing.generate_access_token(user_name)
    refresh_token = hashing.generate_refresh_token(user_name)
    # Set Cookie and redirect to React frontend
    redirect_res = RedirectResponse(f"http://localhost:3000?token={access_token}")
    redirect_res.set_cookie(
        key="refresh_token", value=refresh_token, httponly=True, samesite="lax", secure=False
    )
    return redirect_res
