import os

from alembic import command
from alembic.config import Config


def upgrade_head():
    config = Config(os.path.join(os.path.dirname(__file__), '..', 'alembic.ini'))
    config.set_main_option('sqlalchemy.url', os.getenv('DATABASE_URL', 'sqlite:///./blog.db'))
    command.upgrade(config, 'head')


if __name__ == '__main__':
    upgrade_head()