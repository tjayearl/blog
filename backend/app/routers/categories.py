from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Article, Category, User
from ..schemas import CategoryCreate, CategoryPublic, CategoryUpdate
from ..security import get_current_user


router = APIRouter()


def _slugify(value: str) -> str:
    return value.strip().lower().replace(' ', '-')


def _get_category_or_404(db: Session, category_id: int) -> Category:
    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Category not found')
    return category


@router.get('', response_model=list[CategoryPublic])
def public_categories(db: Session = Depends(get_db)):
    return db.query(Category).order_by(Category.name.asc()).all()


@router.get('/admin', response_model=list[CategoryPublic])
def admin_categories(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Category).order_by(Category.name.asc()).all()


@router.post('/admin', response_model=CategoryPublic, status_code=status.HTTP_201_CREATED)
def create_category(payload: CategoryCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    slug = (payload.slug or _slugify(payload.name)).strip()
    name = payload.name.strip()

    existing = db.query(Category).filter((Category.name == name) | (Category.slug == slug)).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Category already exists')

    category = Category(name=name, slug=slug)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.patch('/admin/{category_id}', response_model=CategoryPublic)
def update_category(
    category_id: int,
    payload: CategoryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    category = _get_category_or_404(db, category_id)
    name = payload.name.strip() if payload.name is not None else category.name
    slug = payload.slug.strip() if payload.slug is not None else category.slug
    if payload.name is not None and payload.slug is None:
        slug = _slugify(name)

    duplicate = db.query(Category).filter(Category.id != category_id, (Category.name == name) | (Category.slug == slug)).first()
    if duplicate:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Category already exists')

    category.name = name
    category.slug = slug
    db.commit()
    db.refresh(category)
    return category


@router.delete('/admin/{category_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    category = _get_category_or_404(db, category_id)
    attached_articles = db.query(Article).filter(Article.categories.any(Category.id == category_id)).count()
    if attached_articles:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Category is attached to articles')

    db.delete(category)
    db.commit()