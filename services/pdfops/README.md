# Python PDFOps Service

The PDFOps service handles CPU‑intensive operations that are impractical to perform in the browser.  It is a lightweight microservice built with [FastAPI](https://fastapi.tiangolo.com/) and uses [Celery](https://docs.celeryq.dev/) with Redis as a broker/result backend to execute long‑running tasks asynchronously.

Supported operations include:

- **OCR** – runs [Tesseract](https://github.com/tesseract-ocr/tesseract) on scanned PDFs and creates a searchable text layer.
- **Optimise** – compresses and optimises PDFs by downsampling images, subsetting fonts and removing unused objects.
- **Redact** – permanently removes selected content from the PDF.

For demonstration purposes the tasks in `tasks.py` simply sleep and update progress.  Replace the implementation with calls to real libraries (e.g. PyPDF2, pdfplumber, pytesseract) to support full functionality.

## Running locally

Install dependencies and start the FastAPI server:

```sh
cd services/pdfops
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 9000
```

In another terminal start the Celery worker:

```sh
celery -A tasks worker --loglevel=info
```

The service exposes endpoints such as `POST /pdf/{file_id}/ocr` which return a job ID.  Clients can subscribe to job progress via `GET /jobs/{job_id}` (server‑sent events).
