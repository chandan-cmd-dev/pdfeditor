# Demo script

This step‑by‑step guide walks you through a typical session using the PDF Editor.  Follow along with the local instance or a deployed instance in the cloud.  It assumes that you have the application running via `docker compose up` and that the database is seeded with a free user and a pro user (`demo@example.com` / `password123`, `pro@example.com` / `password123`).

## 1. Sign up or log in

1. Navigate to [http://localhost:3000](http://localhost:3000).
2. Click **Sign up** and enter your email and password.  Alternatively you can click **Sign in** and use one of the seeded accounts.  The sign‑up flow will send a magic link to your email – copy and paste the verification code into the UI to confirm your account.
3. (Optional) Enable 2FA in your account settings.  Scan the QR code with your authenticator app and verify the token.

## 2. Upload a PDF

1. Once logged in you'll land on the **My Files** page.  Click **Upload** and select a PDF from your computer.  The client generates a secure pre‑signed URL (via the API) and uploads the file directly to the object store.
2. After the upload completes the file appears in your list with metadata (name, size, upload time) and a "free" tag if you're on the free plan.
3. Click the file name to open it in the editor.

## 3. Basic editing

1. Use the thumbnail sidebar to navigate between pages.  Zoom in/out or rotate pages via the toolbar.
2. Click the **Highlight** tool and drag over some text.  Notice that the annotation is stored client‑side until you save.
3. Open the **Text** tool, click on a blank area, and enter some text.  You can adjust the font size and color via the properties panel.
4. Use the **Image** tool to insert an image; choose a file and set its placement and size.
5. Save your changes – this triggers an incremental update via `pdf-lib` and uploads a new version.  You can later restore older versions from the history panel.

## 4. Redaction and OCR (Pro features)

1. Free users can see grayed‑out buttons for redaction and OCR – they act as upsell triggers.  As a pro user you'll be able to click them.
2. Select the **Redact** tool and draw a box over confidential information.  Click **Apply** to permanently remove the content.  A background job is created in `pdfops` and the UI shows a progress bar.
3. For scanned PDFs, click **OCR** – choose a language and submit.  The server will run Tesseract and replace the scanned page images with searchable text.  Once complete, a new version is saved.

## 5. Form filling and signatures

1. If your PDF contains forms, click **Forms** to enter text or choose items.  The form state is saved as part of your edits.
2. Click **Sign** to add a signature placeholder.  You can draw, type or upload a signature.  The server does not apply a cryptographic signature itself; instead it returns a document hash that can be externally signed.  (Support for PKCS#7 could be added in a future version.)

## 6. Optimise and save

1. Use the **Optimize** tool to compress images and merge fonts.  Choose quality settings and submit the job.  A new optimised version will be produced via the `pdfops` service.
2. Click **History** to see all your edit events and versions.  You can restore a previous version by clicking **Restore**.

## 7. Billing and ads

1. Free users will see banner ads at the top and right of the editor.  A consent dialog appears on first visit asking if you accept cookies and personalised ads; decline to disable tracking scripts (ads will still appear but without personalisation).
2. To remove ads and unlock pro features, go to **Billing** in your account menu.  Click **Upgrade** and follow the Stripe checkout process (test mode).  Use the test card `4242 4242 4242 4242`, expiry in the future, any CVC and any ZIP code.
3. After successful payment your plan changes to **Pro** and ads disappear from your interface.

## 8. Admin view (optional)

Administrators can visit `/admin` to view users, files, jobs, and subscription statistics.  Use the seeded admin account (`admin@example.com` / `adminpassword`) to log in.  The admin pages are intentionally simple and read‑only – no destructive operations are exposed in the demo.

This script covers the core capabilities of the platform.  Feel free to explore additional features such as watermarking, splitting/merging pages, and exporting to different formats.  The architecture has been designed to support these and many more tools without major changes.
