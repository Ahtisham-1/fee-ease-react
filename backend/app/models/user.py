from sqlmodel import SQLModel, Field, Relationship
from typing import TYPE_CHECKING, Optional, Literal


class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    role: str = Field(default="parent")
    parent_id: int | None = Field(default=None, foreign_key="parentblueprint.id")


class UserRegister(SQLModel):
    email: str
    password: str
    role: str = "parent"
    parent_id: int | None = None


class UserResponse(SQLModel):
    id: int
    email: str
    role: str
    parent_id: int | None = None


class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"
