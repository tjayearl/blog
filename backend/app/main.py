import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import articles, auth, categories

app = FastAPI(title='Blog CMS API')

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv('CORS_ORIGINS', 'http://localhost:5173').split(','),
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.get('/')
def root():
    return {'message': 'Blog CMS API is running'}


app.include_router(auth.router, prefix='/auth', tags=['auth'])
app.include_router(articles.router, prefix='/articles', tags=['articles'])
app.include_router(categories.router, prefix='/categories', tags=['categories'])