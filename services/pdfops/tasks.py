from celery import Celery
import time
import os

broker_url = os.getenv("PDFOPS_BROKER_URL", "redis://redis:6379/0")
backend_url = os.getenv("PDFOPS_RESULT_BACKEND", "redis://redis:6379/1")
celery = Celery('tasks', broker=broker_url, backend=backend_url)


@celery.task(bind=True)
def ocr_task(self, file_id: str):
    """Simulate an OCR task by sleeping and updating progress"""
    total_steps = 5
    for i in range(total_steps):
        time.sleep(1)
        self.update_state(state='PROGRESS', meta={'progress': int((i + 1) / total_steps * 100)})
    # In a real implementation you'd open the PDF, run OCR via Tesseract,
    # write a new PDF and return the key or file path.  Here we simply
    # return file_id to satisfy the contract.
    return {'result': file_id}


@celery.task(bind=True)
def optimize_task(self, file_id: str):
    total_steps = 3
    for i in range(total_steps):
        time.sleep(1)
        self.update_state(state='PROGRESS', meta={'progress': int((i + 1) / total_steps * 100)})
    return {'result': file_id}


@celery.task(bind=True)
def redact_task(self, file_id: str):
    total_steps = 4
    for i in range(total_steps):
        time.sleep(1)
        self.update_state(state='PROGRESS', meta={'progress': int((i + 1) / total_steps * 100)})
    return {'result': file_id}
