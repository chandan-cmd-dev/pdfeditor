from pdfops.tasks import ocr_task, optimize_task, redact_task


def test_ocr_task():
    # When called synchronously the task returns a dict with the file_id
    result = ocr_task.apply(args=("file123",)).get()
    assert result["result"] == "file123"


def test_optimize_task():
    result = optimize_task.apply(args=("file123",)).get()
    assert result["result"] == "file123"


def test_redact_task():
    result = redact_task.apply(args=("file123",)).get()
    assert result["result"] == "file123"
