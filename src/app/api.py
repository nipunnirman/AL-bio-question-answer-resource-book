from pathlib import Path
import logging
import traceback

from fastapi import FastAPI, File, HTTPException, Request, UploadFile, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from .models import QuestionRequest, QAResponse, OCRResponse
from .services.qa_service import answer_question
from .services.indexing_service import index_pdf_file
from .core.llm.factory import create_chat_model
from langchain_core.messages import HumanMessage
import base64

app = FastAPI(
    title="A/L Biology RAG system",
    description=(
        "API for asking questions about Sri Lankan A/L Biology "
        "Grade 12 & 13 resource books using a multi-agent RAG pipeline."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from .routers.auth import router as auth_router
app.include_router(auth_router)

@app.get("/")
async def root():
    return {
        "message": "A/L Biology RAG System Backend is running. Access API docs at /docs or /redoc"
    }

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

@app.exception_handler(Exception)
async def unhandled_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:  # pragma: no cover - simple demo handler
    """Catch-all handler for unexpected errors.

    FastAPI will still handle `HTTPException` instances and validation errors
    separately; this is only for truly unexpected failures so API consumers
    get a consistent 500 response body.
    """

    if isinstance(exc, HTTPException):
        # Let FastAPI handle HTTPException as usual.
        raise exc

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )


@app.post("/qa", response_model=QAResponse, status_code=status.HTTP_200_OK)
async def qa_endpoint(payload: QuestionRequest) -> QAResponse:
    """Submit a question about A/L Biology.

    Requirements:
    - Accept POST requests at `/qa` with JSON body containing a `question` field
    - Validate the request format and return 400 for invalid requests
    - Return 200 with `answer`, `draft_answer`, and `context` fields
    - Delegate to the multi-agent RAG service layer for processing
    """

    question = payload.question.strip()
    if not question:
        # Explicit validation beyond Pydantic's type checking to ensure
        # non-empty questions.
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="`question` must be a non-empty string.",
        )

    # Delegate to the service layer which runs the multi-agent QA graph
    result = answer_question(question)

    return QAResponse(
        answer=result.get("answer", ""),
        context=result.get("context", ""),
        citations=result.get("citations"),
    )


@app.post("/ocr", response_model=OCRResponse, status_code=status.HTTP_200_OK)
async def ocr_endpoint(file: UploadFile = File(...)) -> OCRResponse:
    """Extract text from an uploaded image of a Biology MCQ using GPT-4o Vision."""

    # Read image bytes first
    contents = await file.read()

    # Detect MIME type reliably from the actual file bytes, not just the upload header
    import imghdr
    detected = imghdr.what(None, h=contents)
    mime_map = {"jpeg": "image/jpeg", "png": "image/png", "gif": "image/gif", "webp": "image/webp", "bmp": "image/bmp"}
    content_type = mime_map.get(detected or "", None) or file.content_type or "image/jpeg"

    if not content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files are supported.",
        )

    # Encode image to base64
    base64_image = base64.b64encode(contents).decode("utf-8")

    # Use GPT-4o Vision with a strong OCR-focused prompt
    llm = create_chat_model(temperature=0.0)

    prompt = (
        "You are an OCR tool. Your ONLY job is to read and return the text written in this image. "
        "The image contains a biology multiple-choice question in Sinhala or English. "
        "Transcribe ALL text in the image exactly as it appears — including the question and all answer options. "
        "Do NOT answer the question. Do NOT translate anything. Do NOT summarize. "
        "Just return the raw text content from the image."
    )

    message = HumanMessage(
        content=[
            {"type": "text", "text": prompt},
            {
                "type": "image_url",
                "image_url": {"url": f"data:{content_type};base64,{base64_image}"},
            },
        ]
    )

    try:
        response = llm.invoke([message])
        extracted_text = str(response.content)
        return OCRResponse(text=extracted_text)
    except Exception as e:
        logging.error(f"OCR failed: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to extract text from image using Vision API.",
        )


@app.post("/index-pdf", status_code=status.HTTP_200_OK)
async def index_pdf(file: UploadFile = File(...)) -> dict:
    """Upload a PDF and index it into the vector database.

    This endpoint:
    - Accepts a PDF file upload
    - Saves it to the local `data/uploads/` directory
    - Uses PyPDFLoader to load the document into LangChain `Document` objects
    - Indexes those documents into the configured Pinecone vector store
    """

    if file.content_type not in ("application/pdf",):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported.",
        )

    upload_dir = Path("data/uploads")
    upload_dir.mkdir(parents=True, exist_ok=True)

    file_path = upload_dir / file.filename
    contents = await file.read()
    file_path.write_bytes(contents)

    # Index the saved PDF
    try:
        chunks_indexed = index_pdf_file(file_path)
    except Exception as e:
        logging.error(f"Failed to index {file.filename}: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to index PDF: {str(e)}",
        )

    return {
        "filename": file.filename,
        "chunks_indexed": chunks_indexed,
        "message": "PDF indexed successfully.",
    }
