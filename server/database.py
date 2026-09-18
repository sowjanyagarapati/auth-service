import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    try:
        conn = psycopg2.connect(
            user=os.environ.get("PGUSER"),
            password=os.environ.get("PGPASSWORD"),
            host=os.environ.get("PGHOST"),
            port=os.environ.get("PGPORT"),
            database=os.environ.get("PGDATABASE")
        )
        return conn
    except Exception as e:
        print("Error connecting to database:", e)
        raise e

def query_database(query: str, params: tuple = ()):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute(query, params)
        
        # If it's a SELECT query or returning, fetch results
        if cursor.description:
            result = cursor.fetchall()
        else:
            result = None
            
        conn.commit()
        cursor.close()
        return result
    except Exception as e:
        if conn:
            conn.rollback()
        print('Database query error:', e)
        raise e
    finally:
        if conn:
            conn.close()

def get_user_by_email(email: str):
    query = "SELECT * FROM users WHERE email = %s"
    result = query_database(query, (email,))
    return result[0] if result else None

def create_user(user_data: dict):
    query = "INSERT INTO users (name, email, password) VALUES (%s, %s, %s) RETURNING *"
    params = (user_data.get('name'), user_data.get('email'), user_data.get('password'))
    result = query_database(query, params)
    return result[0] if result else None

def get_all_users():
    return query_database('SELECT * FROM users')
