import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PdfViewerProps {
  url: string;
}

/**
 * PdfViewer uses PDF.js to render the pages of a PDF document.  Pages are
 * rendered one after another into canvases.  In a real application you'd
 * want to implement virtualisation for performance, but this simple viewer
 * suffices for demonstration purposes.
 */
export default function PdfViewer({ url }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function render() {
      try {
        const loadingTask = pdfjsLib.getDocument({ url });
        const pdf = await loadingTask.promise;
        if (!isMounted) return;
        const numPages = pdf.numPages;
        if (containerRef.current) containerRef.current.innerHTML = '';
        for (let pageNumber = 1; pageNumber <= numPages; pageNumber++) {
          const page = await pdf.getPage(pageNumber);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d')!;
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvasContext: context, viewport }).promise;
          if (containerRef.current) containerRef.current.appendChild(canvas);
        }
        setLoading(false);
      } catch (err) {
        console.error(err);
        if (!isMounted) return;
        setError('Failed to load PDF');
        setLoading(false);
      }
    }
    render();
    return () => {
      isMounted = false;
    };
  }, [url]);
  if (loading) return <p>Loading PDF…</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  return <div ref={containerRef} className="space-y-4"></div>;
}
