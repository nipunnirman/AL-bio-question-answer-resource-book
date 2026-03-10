# A/L BioBot 🧬

A/L BioBot is an AI-powered biology assistant designed to help Sri Lankan Advanced Level (A/L) students learn biology concepts intuitively. It uses a Retrieval-Augmented Generation (RAG) pipeline over standard A/L Biology Resource Books.

## Features ✨
- **Intelligent Q&A** - Ask biology questions and get accurate answers derived directly from official textbooks.
- **RAG Pipeline** - Built with LangChain, Pinecone, and OpenAI for fast and precise document retrieval.
- **Authentication System** - Secure user registration and login implemented with MongoDB Atlas and JWT.
- **Modern UI** - A sleek, mobile-responsive React frontend with dynamic particles and a chat-bubble interface.

---

## Screenshots 📸

Below are some screenshots of the application in action:

*(Save your screenshots to the `docs/screenshots/` folder to display them here!)*

### Chat Interface
![Chat Interface](docs/screenshots/chat.png)

### Sign In
![Sign In](docs/screenshots/login.png)

### Sign Up
![Sign Up](docs/screenshots/register.png)

---

## Tech Stack 🛠️

**Backend:**
- **[FastAPI](https://fastapi.tiangolo.com/)**: High-performance Python async web framework.
- **[LangChain](https://python.langchain.com/)**: LLM & RAG orchestration framework.
- **[Pinecone](https://www.pinecone.io/)**: Vector database for storing textbook embeddings.
- **[MongoDB Atlas](https://www.mongodb.com/)**: Cloud NoSQL database for securely storing user accounts.
- **JWT / Passlib (Bcrypt)**: Secure session tokens and password hashing.

**Frontend:**
- **[React](https://react.dev/) + [Vite](https://vitejs.dev/)**: Fast, modern frontend library.
- **Vanilla CSS**: Fully custom, responsive styling with a magenta aesthetic.

---

## Local Setup 🚀

To run this project locally, follow these steps:

### 1. Backend Setup
Make sure you have Python 3.11+ installed.
```bash
# Clone the repository
git clone https://github.com/nipunnirman/AL-bio-question-answer-resource-book.git
cd AL-bio-question-answer-resource-book

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r pyproject.toml 

# Set up environment variables
# Create a .env file based on the required keys:
# OPENAI_API_KEY, PINECONE_API_KEY, MONGODB_URL, etc.
```

To run the REST API server:
```bash
uvicorn src.app.api:app --reload --port 8000
```

### 2. Frontend Setup
Make sure you have Node.js installed.
```bash
# Navigate to the frontend directory
cd frontend

# Install npm packages
npm install

# Start the development server
npm run dev
```
The React app will be accessible at `http://localhost:5173/`.

---

## Vercel Deployment ☁️
This project is fully configured to be deployed on Vercel.

1. Import the repository into your Vercel Dashboard.
2. The `vercel.json` file handles routing automatically, resolving `/api/*` requests to the Python Serverless logic.
3. Over in your Settings > Environment Variables, make sure to add all corresponding variables from your `.env` (like `MONGODB_URL`, `SECRET_KEY`, `OPENAI_API_KEY`).
4. Hit **Deploy**!
