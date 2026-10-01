# 🔐 Industrial-Grade Authentication & Authorization Service (`auth-service`)

A high-performance, full-stack microservice demonstrating production-ready authentication and authorization patterns. Built with **Python (FastAPI)**, **PostgreSQL**, and **React (Vite)**, utilizing a dual-token architecture (**Short-lived JWT Access Tokens** + **Long-lived HttpOnly Cookie Refresh Tokens**) and **Google OAuth 2.0 Social Authentication**.

---

### ⚡ Executive Summary
* **What it is**: An enterprise-grade authentication service supporting registration, password login, Google OAuth 2.0 social login, and secure session management.
* **Why it matters**: Solves major web security threats (XSS & CSRF) using a **Dual-Token Architecture** (Short-lived JWT Access Tokens + Secure HttpOnly Refresh Cookie) and decouples third-party OAuth provider tokens from internal application security.
* **Tech Stack**: Python (FastAPI), Async HTTP (`httpx`), React 18, PostgreSQL, PyJWT, Passlib (Bcrypt).

---

## 🌟 Architecture & Security Highlights

* **Google OAuth 2.0 Integration**: Implements the **OAuth 2.0 Authorization Code Flow** using `httpx` async requests to exchange Google auth codes for profile info (`email`, `name`).
* **Decoupled Identity Pattern**: Google OAuth tokens are exchanged internally and swapped for **your application's own JWT Access Token** and **HttpOnly Refresh Cookie**, ensuring unified client security regardless of identity provider.
* **Stateless Access Tokens (JWT)**: Short-lived access tokens (15-min expiry) passed via standard `Authorization: Bearer` headers to protect API endpoints without database overhead.
* **XSS-Resistant Refresh Tokens**: Long-lived refresh tokens (7-day expiry) stored in **`HttpOnly`**, **`SameSite=Lax`** cookies—completely inaccessible to client-side JavaScript.
* **Silent Token Rotation**: Automatic client-side `401 Unauthorized` interception in React to silently refresh access tokens without forcing the user to log in again.
* **Bcrypt Password Security**: Zero plain-text password storage, using `passlib` bcrypt salted password hashing.

---

## 🏗️ System Architecture & Data Flow

### 1. Google OAuth 2.0 Social Login Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 User / Browser
    participant React as 💻 React App
    participant API as ⚡ Backend (FastAPI)
    participant Google as 🔑 Google OAuth Server
    participant DB as 🐘 PostgreSQL DB

    User->>React: 1. Clicks "Sign in with Google"
    React->>API: 2. Redirects to GET /auth/google/login
    API-->>User: 3. HTTP 307 Redirect to Google Auth URL
    User->>Google: 4. Authenticate & Grant Permission
    Google-->>API: 5. Redirect to GET /auth/google/callback?code=AUTH_CODE
    
    API->>Google: 6. POST /token (Exchange AUTH_CODE via async httpx)
    Google-->>API: 7. Returns Google Access Token & Profile (Email, Name)
    
    API->>DB: 8. Find or Create User Record in PostgreSQL
    API->>API: 9. Generate App Access Token (JWT) + HttpOnly Refresh Cookie
    API-->>User: 10. HTTP 307 Redirect to React (http://localhost:3000?token=JWT)
    React->>React: 11. Extract JWT, Store in localStorage & Clean URL
```

### 2. Standard Auth & Token Refresh Flow

```mermaid
sequenceDiagram
    autonumber
    actor Client as 💻 Client (React App)
    participant API as ⚡ Backend (FastAPI)
    participant DB as 🐘 Database (PostgreSQL)

    Note over Client, DB: 1. User Authentication (Password Login)
    Client->>API: POST /login (Email, Password)
    API->>DB: Verify Bcrypt Password Hash
    DB-->>API: Password Verified
    API-->>Client: Return Access Token (JSON) + Set Refresh Token (HttpOnly Cookie)

    Note over Client, DB: 2. Accessing Protected Resource
    Client->>API: GET /random (Headers: Bearer <AccessToken>)
    API-->>Client: 200 OK + Data Payload

    Note over Client, DB: 3. Token Expiration & Silent Refresh Flow
    Client->>API: GET /random (Expired AccessToken)
    API-->>Client: 401 Unauthorized
    Client->>API: POST /refresh (Auto-sends HttpOnly Cookie)
    API-->>Client: Return NEW Access Token
    Client->>API: Retry GET /random (with NEW AccessToken)
    API-->>Client: 200 OK + Data Payload
```

---

## 🗄️ Database Schema & Design

The service utilizes a **PostgreSQL** relational database. Password hashes are stored securely using salted Bcrypt, while third-party OAuth users (e.g., Google) have an empty or null password string.

### 1. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS {
        int id PK "Auto-increment Primary Key"
        string name "User Full Name"
        string email UK "Unique Email Address"
        string password "Bcrypt Hashed Password (Empty/NULL for OAuth)"
        timestamp created_at "Account Creation Timestamp"
    }
```

### 2. SQL DDL Schema

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT, -- Bcrypt hash or empty for OAuth users
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🧰 Tech Stack

### Backend
* **Language & Framework**: Python 3.10+, FastAPI (ASGI)
* **Server**: Uvicorn
* **Async HTTP Client**: `httpx` (Google OAuth exchange)
* **Database**: PostgreSQL (Driver: `psycopg2`)
* **Security & Auth**: PyJWT, Passlib (Bcrypt)

### Frontend
* **UI Framework**: React 18
* **Build System**: Vite
* **HTTP Client**: Axios (with Credentials support)

---

## 📡 API Reference

### 1. Public & OAuth Endpoints

| Method | Endpoint | Description | Payload / Parameters |
| :--- | :--- | :--- | :--- |
| `POST` | `/users/create` | Register a new user account | `{ "name": "...", "email": "...", "password": "..." }` |
| `POST` | `/login` | Authenticate user & issue token pair | `{ "email": "...", "password": "..." }` |
| `GET` | `/auth/google/login` | Initiates Google OAuth 2.0 authorization redirect | None |
| `GET` | `/auth/google/callback` | Handles Google OAuth callback code & issues app JWT | Query Param: `?code=AUTH_CODE` |

### 2. Authentication & Protected Endpoints

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/refresh` | `HttpOnly` Cookie | Validates refresh token cookie & returns new Access Token |
| `GET` | `/random` | `Bearer <AccessToken>` | Example protected route returning user-specific data |
| `GET` | `/users` | None | Returns registered users (admin inspection) |

---

## ⚙️ Local Setup & Installation

### Prerequisites
* Python 3.10+
* Node.js v18+
* PostgreSQL server running locally
* Google OAuth 2.0 Client ID & Client Secret (from [Google Cloud Console](https://console.cloud.google.com/))

### 1. Backend Setup (FastAPI)

```bash
# Navigate to server directory
cd server

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install fastapi uvicorn passlib bcrypt pyjwt psycopg2-binary python-dotenv httpx

# Configure environment variables (.env)
# Create a .env file with:
PORT=5000
PGUSER=postgres
PGPASSWORD=your_password
PGHOST=localhost
PGPORT=5432
PGDATABASE=postgres
JWT_SECRET=your_super_secret_access_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Run FastAPI server
uvicorn main:app --reload --port 5000
```

### 2. Frontend Setup (React / Vite)

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start Vite development server
npm start
```

Open `http://localhost:3000` in your browser to interact with the application dashboard!