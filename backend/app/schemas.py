from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserPublic(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: str

    model_config = ConfigDict(from_attributes=True)


class CategoryBase(BaseModel):
    name: str
    slug: str | None = None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None


class CategoryPublic(CategoryBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = 'bearer'
    user: UserPublic


class ArticleBase(BaseModel):
    title: str
    slug: str
    excerpt: str
    content: str
    cover_image: str | None = None
    published: bool = False
    categories: list[str] = []


class ArticleCreate(ArticleBase):
    pass


class ArticleUpdate(BaseModel):
    title: str | None = None
    slug: str | None = None
    excerpt: str | None = None
    content: str | None = None
    cover_image: str | None = None
    published: bool | None = None
    categories: list[str] | None = None


class ArticlePublic(ArticleBase):
    id: int
    author_id: int
    created_at: datetime | None = None
    updated_at: datetime | None = None
    author: UserPublic
    categories: list[CategoryPublic] = []

    model_config = ConfigDict(from_attributes=True)


class ArticleListItem(BaseModel):
    id: int
    title: str
    slug: str
    excerpt: str
    cover_image: str | None = None
    published: bool
    author: UserPublic
    created_at: datetime | None = None
    updated_at: datetime | None = None
    categories: list[CategoryPublic] = []

    model_config = ConfigDict(from_attributes=True)


class ArticleStats(BaseModel):
    total: int
    published: int
    drafts: int