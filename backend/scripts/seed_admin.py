import argparse
import os

from app.database import SessionLocal
from app.models import Article, Category, User
from app.security import hash_password
from scripts.migrate import upgrade_head
SAMPLE_CATEGORIES = [
    {'name': 'Getting Started', 'slug': 'getting-started'},
    {'name': 'Engineering', 'slug': 'engineering'},
    {'name': 'Publishing', 'slug': 'publishing'},
]

SAMPLE_ARTICLES = [
    {
        'title': 'Welcome to the Blog CMS',
        'slug': 'welcome-to-the-blog-cms',
        'excerpt': 'A short tour of the content model, auth flow, and publishing workflow.',
        'content': 'This is the first published article in the CMS.\nIt demonstrates the Phase 1 publishing path and category support.',
        'published': True,
        'categories': ['Getting Started', 'Publishing'],
    },
    {
        'title': 'How the Admin Dashboard Fits Together',
        'slug': 'how-the-admin-dashboard-fits-together',
        'excerpt': 'A closer look at articles, stats, and the publishing queue.',
        'content': 'The admin dashboard is designed to keep article operations simple.\nIt can evolve into moderation and analytics later.',
        'published': True,
        'categories': ['Engineering'],
    },
]


def _get_or_create_category(db, name: str, slug: str) -> Category:
    category = db.query(Category).filter(Category.slug == slug).first()
    if category:
        return category

    category = Category(name=name, slug=slug)
    db.add(category)
    db.flush()
    return category


def _seed_sample_content(db, admin_user: User):
    categories_by_name = {
        category['name']: _get_or_create_category(db, category['name'], category['slug'])
        for category in SAMPLE_CATEGORIES
    }

    for article_data in SAMPLE_ARTICLES:
        existing_article = db.query(Article).filter(Article.slug == article_data['slug']).first()
        if existing_article:
            continue

        article = Article(
            title=article_data['title'],
            slug=article_data['slug'],
            excerpt=article_data['excerpt'],
            content=article_data['content'],
            published=article_data['published'],
            author_id=admin_user.id,
        )
        article.categories = [categories_by_name[name] for name in article_data['categories']]
        db.add(article)


def seed_admin(username: str, email: str, password: str):
    upgrade_head()

    db = SessionLocal()
    try:
        existing_user = db.query(User).filter((User.username == username) | (User.email == email)).first()
        if existing_user:
            print(f'Admin user already exists: {existing_user.username}')
            admin_user = existing_user
        else:
            admin_user = User(
                username=username,
                email=email,
                password_hash=hash_password(password),
                role='admin',
            )
            db.add(admin_user)
            db.flush()
            print(f'Created admin user: {username}')

        _seed_sample_content(db, admin_user)
        db.commit()
        print('Seeded sample categories and articles')
    finally:
        db.close()


def build_parser():
    parser = argparse.ArgumentParser(description='Seed the first admin user for the blog CMS')
    parser.add_argument('--username', default=os.getenv('ADMIN_USERNAME', 'admin'))
    parser.add_argument('--email', default=os.getenv('ADMIN_EMAIL', 'admin@example.com'))
    parser.add_argument('--password', default=os.getenv('ADMIN_PASSWORD', 'admin1234'))
    return parser


def main():
    args = build_parser().parse_args()
    seed_admin(args.username, args.email, args.password)


if __name__ == '__main__':
    main()