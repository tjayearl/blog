from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import LoginResponse, UserCreate, UserLogin, UserPublic
from ..security import create_access_token, get_current_user, hash_password, verify_password


router = APIRouter()


@router.post('/register', response_model=UserPublic)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(or_(User.username == payload.username, User.email == payload.email)).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Username or email already exists')

    user = User(
        username=payload.username,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role='admin',
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post('/login', response_model=LoginResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid username or password')

    return {
        'access_token': create_access_token(str(user.id)),
        'token_type': 'bearer',
        'user': UserPublic.model_validate(user),
    }


@router.get('/me', response_model=UserPublic)
def me(current_user: User = Depends(get_current_user)):
    return current_user