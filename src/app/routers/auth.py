from fastapi import APIRouter, HTTPException, status
from ..models import UserCreate, UserResponse, UserLogin, Token
from ..core.security import get_password_hash, verify_password, create_access_token
from ..core.db import get_database

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate):
    db = get_database()
    
    # Check if user already exists
    existing_user = await db["users"].find_one({"$or": [{"username": user.username}, {"email": user.email}]})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )
        
    # Hash password and save
    user_dict = user.model_dump()
    user_dict["hashed_password"] = get_password_hash(user_dict.pop("password"))
    
    result = await db["users"].insert_one(user_dict)
    
    return UserResponse(
        id=str(result.inserted_id),
        username=user.username,
        email=user.email
    )

@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin):
    db = get_database()
    
    # Find user
    user = await db["users"].find_one({"username": user_credentials.username})
    if not user or not verify_password(user_credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # Create token
    access_token = create_access_token(data={"sub": user["username"]})
    
    return Token(access_token=access_token, token_type="bearer")
