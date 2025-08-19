from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from uuid import uuid4
import os
import asyncio
from celery import Celery
from tasks import ocr_task, optimize_task, redact_task
from fastapi.middleware.cors import CORSMiddleware

# Configure Celery
broker_url = os.getenv("PDFOPS_BROKER_URL", "redis://redis:6379/0")
backend_url = os.getenv("PDFOPS_RESULT_BACKEND", "redis://redis:6379/1")
celery_app = Celery('pdfops', broker=broker_url, backend=backend_url)

app = FastAPI(title="PDFOps Service")


class JobResponse(BaseModel):
    job_id: str


@app.post("/pdf/{file_id}/ocr", response_model=JobResponse)
async def start_ocr(file_id: str):
    # Kick off OCR task
    task = ocr_task.delay(file_id)
    return {"job_id": task.id}


@app.post("/pdf/{file_id}/optimize", response_model=JobResponse)
async def start_optimize(file_id: str):
    task = optimize_task.delay(file_id)
    return {"job_id": task.id}


@app.post("/pdf/{file_id}/redact", response_model=JobResponse)
async def start_redact(file_id: str):
    task = redact_task.delay(file_id)
    return {"job_id": task.id}


@app.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    async def event_stream():
        # Periodically poll the task result and yield progress updates
        while True:
            result = celery_app.AsyncResult(job_id)
            info = result.info or {}
            state = result.state
            # Emit JSON line
            yield f"data: {{\"state\": \"{state}\", \"progress\": {info.get('progress', 0)} }}\n\n"
            if state in ("SUCCESS", "FAILURE", "REVOKED"):
                break
            await asyncio.sleep(1)
    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.get("/health")
async def health():
    return {"status": "ok"}

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)