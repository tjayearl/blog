from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import selectinload
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Article, Category, User
from ..schemas import ArticleCreate, ArticleListItem, ArticlePublic, ArticleStats, ArticleUpdate, CategoryPublic
from ..security import get_current_user


router = APIRouter()


def _get_article_or_404(db: Session, article_id: int) -> Article:
    article = db.get(Article, article_id)
    if article is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Article not found')
    return article


def _get_or_create_categories(db: Session, category_names: list[str] | None) -> list[Category]:
    if not category_names:
        return []

    categories: list[Category] = []
    for raw_name in category_names:
        name = raw_name.strip()
        if not name:
            continue

        slug = name.lower().replace(' ', '-')
        category = db.query(Category).filter(Category.slug == slug).first()
        if category is None:
            category = Category(name=name, slug=slug)
            db.add(category)
            db.flush()
        categories.append(category)

    return categories


@router.get('/categories', response_model=list[CategoryPublic])
def public_categories(db: Session = Depends(get_db)):
    return db.query(Category).order_by(Category.name.asc()).all()


@router.get('', response_model=list[ArticleListItem])
def public_articles(
    db: Session = Depends(get_db),
    search: str | None = Query(default=None),
    category: str | None = Query(default=None),
):
    query = (
        db.query(Article)
        .options(selectinload(Article.categories), selectinload(Article.author))
        .join(User, Article.author_id == User.id)
        .filter(Article.published.is_(True))
        .order_by(Article.created_at.desc())
    )
    if search:
        like = f'%{search}%'
        query = query.filter((Article.title.ilike(like)) | (Article.excerpt.ilike(like)) | (Article.content.ilike(like)))
    if category:
        query = query.join(Article.categories).filter(Category.slug == category)
    return query.all()


@router.get('/slug/{slug}', response_model=ArticlePublic)
def public_article(slug: str, db: Session = Depends(get_db)):
    article = (
        db.query(Article)
        .options(selectinload(Article.categories), selectinload(Article.author))
        .filter(Article.slug == slug, Article.published.is_(True))
        .first()
    )
    if article is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Article not found')
    return article


@router.get('/admin', response_model=list[ArticleListItem])
def admin_articles(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(Article)
        .options(selectinload(Article.categories), selectinload(Article.author))
        .join(User, Article.author_id == User.id)
        .order_by(Article.created_at.desc())
        .all()
    )


@router.get('/admin/stats', response_model=ArticleStats)
def article_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    total = db.query(func.count(Article.id)).scalar() or 0
    published = db.query(func.count(Article.id)).filter(Article.published.is_(True)).scalar() or 0
    return ArticleStats(total=total, published=published, drafts=total - published)


@router.post('', response_model=ArticlePublic, status_code=status.HTTP_201_CREATED)
def create_article(
    payload: ArticleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = db.query(Article).filter(Article.slug == payload.slug).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Slug already exists')

    article_data = payload.model_dump(exclude={'categories'})
    article = Article(**article_data, author_id=current_user.id)
    article.categories = _get_or_create_categories(db, payload.categories)
    db.add(article)
    db.commit()
    db.refresh(article)
    return article


@router.patch('/{article_id}', response_model=ArticlePublic)
def update_article(
    article_id: int,
    payload: ArticleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    article = _get_article_or_404(db, article_id)
    changes = payload.model_dump(exclude_unset=True)
    if 'slug' in changes:
        duplicate = db.query(Article).filter(Article.slug == changes['slug'], Article.id != article_id).first()
        if duplicate:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Slug already exists')

    categories = changes.pop('categories', None)
    for field_name, value in changes.items():
        setattr(article, field_name, value)
    article.author_id = current_user.id

    if categories is not None:
        article.categories = _get_or_create_categories(db, categories)

    db.commit()
    db.refresh(article)
    return article


@router.delete('/{article_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_article(article_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    article = _get_article_or_404(db, article_id)
    db.delete(article)
    db.commit()