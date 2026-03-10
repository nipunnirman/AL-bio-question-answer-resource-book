"""
Pydantic request/response schemas for the QA API.
Used by the FastAPI `/qa` endpoint.
"""

from typing import Dict, Any, Optional
from pydantic import BaseModel


class QuestionRequest(BaseModel):
    """
    Request body for the `/qa` endpoint.

    Contains the user's natural language question
    about A/L Biology (Grade 12 & Grade 13 textbooks).
    """

    question: str


class QAResponse(BaseModel):
    """
    Response body for the `/qa` endpoint.

    The API returns:
    - the final verified answer
    - the retrieved context used to generate the answer
    - citation metadata for traceability
    """

    answer: str
    context: str
    citations: Optional[Dict[str, Dict[str, Any]]] = None


class UserCreate(BaseModel):
    username: str
    email: str
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: str
    username: str
    email: str


class Token(BaseModel):
    access_token: str
    token_type: str