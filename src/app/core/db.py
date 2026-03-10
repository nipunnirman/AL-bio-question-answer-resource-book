from motor.motor_asyncio import AsyncIOMotorClient
from .config import get_settings

settings = get_settings()

client = None

def get_database():
    """Get the MongoDB database instance."""
    global client
    if client is None:
        client = AsyncIOMotorClient(settings.mongodb_url)
    
    # We will use a database named "albio_auth"
    return client.albio_auth
