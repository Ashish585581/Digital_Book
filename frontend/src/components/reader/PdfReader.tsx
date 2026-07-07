import { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { ZoomIn, ZoomOut, Maximize, Minimize, Loader2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { progressApi } from '@/api/progress';

// Configure PDF.js worker
let workerConfigured = false;
function configureWorker() {
  if (workerConfigured) return;
  // Use jsDelivr CDN for reliable ES module loading of worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  workerConfigured = true;
}

interface PdfReaderProps {
  bookId: number;
  onClose?: () => void;
}

interface RenderedPage {
  pageNum: number;
  canvas: HTMLCanvasElement;
}

export function PdfReader({ bookId, onClose }: PdfReaderProps) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set());

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const canvasMapRef = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const pageHeightsRef = useRef<number[]>([]);
  const scaleRef = useRef(1.0);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRenderingRef = useRef(false);
  const renderQueueRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);

  // Keep scaleRef in sync
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  // Load PDF
  useEffect(() => {
    configureWorker();
    let cancelled = false;

    const loadPdf = async () => {
      try {
        setLoading(true);
        setError(null);
        setLoadProgress(0);

        const token = localStorage.getItem('access_token');
        const response = await fetch(`/api/v1/books/${bookId}/stream`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to load PDF: ${response.status} ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();

        if (cancelled) return;

        const loadingTask = pdfjsLib.getDocument({
          data: arrayBuffer,
        });

        loadingTask.onProgress = (progress: { loaded: number; total: number }) => {
          if (progress.total) {
            setLoadProgress(Math.round((progress.loaded / progress.total) * 100));
          }
        };

        const pdf = await loadingTask.promise;

        if (cancelled) {
          pdf.destroy();
          return;
        }

        pdfDocRef.current = pdf;
        setNumPages(pdf.numPages);
        pageHeightsRef.current = new Array(pdf.numPages).fill(0);

        // Load saved progress
        try {
          const savedProgress = await progressApi.getProgress(bookId);
          if (savedProgress.last_position && !cancelled) {
            const savedPage = parseInt(savedProgress.last_position.replace('page:', ''), 10);
            if (savedPage > 1 && savedPage <= pdf.numPages) {
              setCurrentPage(savedPage);
            }
          }
        } catch {
          // No saved progress
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      cancelled = true;
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy();
        pdfDocRef.current = null;
      }
    };
  }, [bookId]);

  // Render a single page
  const renderPage = useCallback(async (pageNum: number, canvas: HTMLCanvasElement, renderScale: number) => {
    const pdf = pdfDocRef.current;
    if (!pdf || !canvas) return;

    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: renderScale });
      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Store page height for scroll calculations
      pageHeightsRef.current[pageNum - 1] = viewport.height;

      await page.render({
        canvasContext: context,
        viewport,
      }).promise;
    } catch (err) {
      console.error(`Error rendering page ${pageNum}:`, err);
    }
  }, []);

  // Process render queue with RAF batching
  useEffect(() => {
    const processQueue = () => {
      if (isRenderingRef.current || renderQueueRef.current.length === 0 || !pdfDocRef.current) {
        rafRef.current = requestAnimationFrame(processQueue);
        return;
      }

      isRenderingRef.current = true;
      const pageNum = renderQueueRef.current.shift()!;
      const canvas = canvasMapRef.current.get(pageNum);

      if (canvas && !renderedPages.has(pageNum)) {
        renderPage(pageNum, canvas, scaleRef.current).then(() => {
          setRenderedPages((prev) => new Set([...prev, pageNum]));
          isRenderingRef.current = false;
        });
      } else {
        isRenderingRef.current = false;
      }

      rafRef.current = requestAnimationFrame(processQueue);
    };

    rafRef.current = requestAnimationFrame(processQueue);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [renderPage, renderedPages]);

  // Queue page for rendering
  const queuePageRender = useCallback((pageNum: number) => {
    if (!renderQueueRef.current.includes(pageNum) && !renderedPages.has(pageNum)) {
      renderQueueRef.current.push(pageNum);
    }
  }, [renderedPages]);

  // Handle scroll - detect visible pages
  const handleScroll = useCallback(() => {
    if (!scrollRef.current || pageHeightsRef.current.length === 0) return;

    const scrollTop = scrollRef.current.scrollTop;
    const containerHeight = scrollRef.current.clientHeight;
    let accumulatedHeight = 0;
    let visiblePage = 1;

    for (let i = 0; i < pageHeightsRef.current.length; i++) {
      const pageHeight = pageHeightsRef.current[i] || 600; // fallback estimate
      if (scrollTop < accumulatedHeight + pageHeight) {
        visiblePage = i + 1;
        break;
      }
      accumulatedHeight += pageHeight + 16; // 16px gap
    }

    // Queue nearby pages for rendering
    for (let i = Math.max(0, visiblePage - 3); i < Math.min(numPages, visiblePage + 5); i++) {
      queuePageRender(i + 1);
    }

    if (visiblePage !== currentPage) {
      setCurrentPage(visiblePage);
      saveProgress(visiblePage);
    }
  }, [currentPage, numPages, queuePageRender]);

  // Save progress debounced
  const saveProgress = useCallback(
    (page: number) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const percent = Math.round((page / numPages) * 100);
          await progressApi.updateProgress(bookId, {
            progress_percent: percent,
            last_position: `page:${page}`,
          });
        } catch {
          // Silently fail
        }
      }, 1000);
    },
    [bookId, numPages]
  );

  // Go to prev/next page
  const goToPrevPage = () => {
    const newPage = Math.max(currentPage - 1, 1);
    setCurrentPage(newPage);
    scrollToPage(newPage);
  };

  const goToNextPage = () => {
    const newPage = Math.min(currentPage + 1, numPages);
    setCurrentPage(newPage);
    scrollToPage(newPage);
  };

  const scrollToPage = (pageNum: number) => {
    if (!scrollRef.current) return;

    let scrollTop = 0;
    for (let i = 0; i < pageNum - 1; i++) {
      scrollTop += pageHeightsRef.current[i] || 0;
      scrollTop += 16;
    }
    scrollRef.current.scrollTop = scrollTop;
  };

  // Zoom
  const zoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3.0));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));

  // Fullscreen
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        goToPrevPage();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') {
        goToNextPage();
      } else if (e.key === '+' || e.key === '=') {
        zoomIn();
      } else if (e.key === '-') {
        zoomOut();
      } else if (e.key === 'f' || e.key === 'F') {
        void toggleFullscreen();
      } else if (e.key === 'Home') {
        setCurrentPage(1);
        scrollToPage(1);
      } else if (e.key === 'End') {
        setCurrentPage(numPages);
        scrollToPage(numPages);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, numPages]);

  // Fullscreen change handler
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Initial render of first few pages when PDF loads
  useEffect(() => {
    if (!loading && numPages > 0) {
      // Queue first 5 pages for initial render
      for (let i = 1; i <= Math.min(5, numPages); i++) {
        queuePageRender(i);
      }
    }
  }, [loading, numPages, queuePageRender]);

  // Sync scroll position when currentPage changes (from button nav, not scroll)
  useEffect(() => {
    if (!loading && numPages > 0 && scrollRef.current) {
      // Only scroll if not already at the right position (prevent infinite loops)
      const targetScrollTop = calculateScrollTop(currentPage);
      const currentScrollTop = scrollRef.current.scrollTop;
      const tolerance = 50; // pixels
      if (Math.abs(targetScrollTop - currentScrollTop) > tolerance) {
        scrollRef.current.scrollTop = targetScrollTop;
      }
    }
  }, [currentPage, loading, numPages]);

  // Calculate scroll top for a given page number
  const calculateScrollTop = (pageNum: number): number => {
    let scrollTop = 0;
    for (let i = 0; i < pageNum - 1; i++) {
      scrollTop += pageHeightsRef.current[i] || 0;
      scrollTop += 16; // gap between pages
    }
    return scrollTop;
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">Error Loading PDF</p>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background" ref={containerRef}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b bg-card px-4 py-2 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            Page {currentPage} of {numPages}
          </span>
          <span className="text-xs text-muted-foreground">(scroll to navigate)</span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={zoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="w-14 text-center text-sm font-medium">{Math.round(scale * 100)}%</span>
          <Button variant="outline" size="icon" onClick={zoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <div className="mx-2 h-6 w-px bg-border" />
          <Button variant="outline" size="icon" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* PDF Viewer - Continuous Scroll */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto bg-muted/30"
        onScroll={handleScroll}
      >
        {loading ? (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="text-center">
              <p className="font-medium">Loading PDF...</p>
              <p className="mt-1 text-sm text-muted-foreground">{loadProgress}% complete</p>
            </div>
            <div className="h-2 w-48 rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary transition-all duration-300"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 p-6">
            {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
              <div
                key={pageNum}
                className="relative"
                data-page-num={pageNum}
              >
                <canvas
                  ref={(el) => {
                    if (el) {
                      canvasMapRef.current.set(pageNum, el);
                      // Initial render for visible pages
                      if (pageNum <= 5) {
                        queuePageRender(pageNum);
                      }
                    }
                  }}
                  className="shadow-lg"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
