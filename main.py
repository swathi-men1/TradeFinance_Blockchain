from fastapi import FastAPI
from passlib.context import CryptContext

app = FastAPI()

@app.get("/")
def home():
    return {"message": "My first FastAPI project is running"}
from pydantic import BaseModel

class UserSignup(BaseModel):
    name: str
    email: str
    password: str



@app.post("/signup")
def signup(user: UserSignup):
    hashed_pwd = hash_password(user.password)

    return {
        "message": "User registered successfully",
        "name": user.name,
        "email": user.email,
        "hashed_password": hashed_pwd
    }

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    return pwd_context.hash(password[:72])

