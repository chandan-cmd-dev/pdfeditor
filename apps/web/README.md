# Next.js Web Application

This folder contains the browser client for the PDF editor, implemented with [Next.js](https://nextjs.org/) and [React](https://react.dev/) using TypeScript.  The UI is designed to be minimalist and accessible, with a focus on smooth PDF rendering and intuitive editing tools.

## Running locally

To start the development server:

```sh
cd apps/web
npm install
npm run dev
```

This will launch the app on `http://localhost:3000`.  The frontend assumes the API service is running on `http://localhost:8080` and the PDFOps service is running on `http://localhost:9000` – adjust the `.env` or `NEXT_PUBLIC_*` variables as needed.

## Key folders and files

- `pages/` – Next.js pages; routes correspond to filenames.  Pages such as `login.tsx`, `signup.tsx`, `files/index.tsx` and `files/[id].tsx` implement authentication, file management and PDF viewing.
- `components/` – Reusable UI pieces including `Layout` and `PdfViewer`.  The latter uses PDF.js to render documents.
- `lib/api.ts` – A tiny helper around `fetch()` for making API requests with automatic JSON parsing and cookie inclusion.
- `styles/` – Tailwind CSS configuration and global styles.

## Styling and animations

TailwindCSS provides the design primitives, while [Framer Motion](https://www.framer.com/motion/) is available for subtle animations (not used extensively in this skeleton).  Dark mode is supported via the `dark` class on the `<html>` element.
