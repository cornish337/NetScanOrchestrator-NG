from fastapi import FastAPI
from .routers import scans

app = FastAPI()
app.include_router(scans.router)
