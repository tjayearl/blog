import os

from alembic import command
from alembic.config import Config


def show_status():
    config = Config(os.path.join(os.path.dirname(__file__), '..', 'alembic.ini'))
    config.set_main_option('sqlalchemy.url', os.getenv('DATABASE_URL', 'sqlite:///./blog.db'))
    print('Current revision:')
    command.current(config, verbose=True)
    print('Heads:')
    command.heads(config, verbose=True)


if __name__ == '__main__':
    show_status()