from pydantic import BaseModel
from typing import Literal

class User(BaseModel):
    username: str
    role: Literal["BUYER", "SELLER", "BANK"]

class UserCreate(BaseModel):
    username: str
    password: str
    role: Literal["BUYER", "SELLER", "BANK"]

class UserLogin(BaseModel):
    username: str
    password: str
