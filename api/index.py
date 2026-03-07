import sys
import os

# Add project root to path so `src.app.api` can be found on Vercel
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.app.api import app

# This file is used as an entrypoint for Vercel Serverless Functions.
