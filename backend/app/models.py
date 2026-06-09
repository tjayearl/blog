from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Table, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base


article_categories = Table(
    'article_categories',
    Base.metadata,
    Column('article_id', ForeignKey('articles.id'), primary_key=True),
    Column('category_id', ForeignKey('categories.id'), primary_key=True),
)


class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(32), default='admin', nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    articles = relationship('Article', back_populates='author')


class Article(Base):
    __tablename__ = 'articles'

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), index=True, nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    excerpt = Column(String(500), nullable=False)
    content = Column(Text, nullable=False)
    cover_image = Column(String(500), nullable=True)
    published = Column(Boolean, default=False, nullable=False)
    author_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    author = relationship('User', back_populates='articles')
    categories = relationship('Category', secondary=article_categories, back_populates='articles')


class Category(Base):
    __tablename__ = 'categories'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(80), unique=True, index=True, nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    articles = relationship('Article', secondary=article_categories, back_populates='categories')