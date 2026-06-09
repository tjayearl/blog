"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-06-09 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = '0001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('username', sa.String(length=64), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=32), nullable=False, server_default='admin'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )
    op.create_index('ix_users_username', 'users', ['username'], unique=True)
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    op.create_table(
        'categories',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(length=80), nullable=False),
        sa.Column('slug', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )
    op.create_index('ix_categories_name', 'categories', ['name'], unique=True)
    op.create_index('ix_categories_slug', 'categories', ['slug'], unique=True)

    op.create_table(
        'articles',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=255), nullable=False),
        sa.Column('excerpt', sa.String(length=500), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('cover_image', sa.String(length=500), nullable=True),
        sa.Column('published', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('author_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_articles_title', 'articles', ['title'], unique=False)
    op.create_index('ix_articles_slug', 'articles', ['slug'], unique=True)

    op.create_table(
        'article_categories',
        sa.Column('article_id', sa.Integer(), sa.ForeignKey('articles.id'), primary_key=True),
        sa.Column('category_id', sa.Integer(), sa.ForeignKey('categories.id'), primary_key=True),
    )


def downgrade():
    op.drop_table('article_categories')
    op.drop_index('ix_articles_slug', table_name='articles')
    op.drop_index('ix_articles_title', table_name='articles')
    op.drop_table('articles')
    op.drop_index('ix_categories_slug', table_name='categories')
    op.drop_index('ix_categories_name', table_name='categories')
    op.drop_table('categories')
    op.drop_index('ix_users_email', table_name='users')
    op.drop_index('ix_users_username', table_name='users')
    op.drop_table('users')