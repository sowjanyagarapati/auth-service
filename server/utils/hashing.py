from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def encrypt(password):
    return pwd_context.hash(password)

def verify_password(password, hashed_pw):
    return pwd_context.verify(password, hashed_pw)