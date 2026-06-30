import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ePub, { Book, Rendition } from 'epubjs';
import { Button } from '@/components/common/Button';
import { progressApi } from '@/api/progress';

interface EpubReaderProps {
  bookId: number;
}

export function EpubReader({ bookId }: EpubReaderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [fontSize, setFontSize] = useState(100);

  const viewerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<Book | null>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedLocationRef = useRef<string | null>(null);

  // Initialize book
  useEffect(() => {
    const initBook = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = localStorage.getItem('access_token');
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/books/${bookId}/stream`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to load EPUB');
        }

        const arrayBuffer = await response.arrayBuffer();

        // Create book
        const book = ePub(arrayBuffer);
        bookRef.current = book;

        // Wait for book to be ready
        await book.ready;

        // Get spine length
        const spine = book.spine as unknown as { length: number };
        const spineLength = spine?.length || 1;

        // Restore progress
        try {
          const savedProgress = await progressApi.getProgress(bookId);
          if (savedProgress.last_position) {
            savedLocationRef.current = savedProgress.last_position;
          }
        } catch {
          // No saved progress
        }

        // Initialize rendition
        if (viewerRef.current) {
          const rendition = book.renderTo(viewerRef.current, {
            width: '100%',
            height: '100%',
            spread: 'auto',
          });

          renditionRef.current = rendition;

          // Navigate to saved position or start
          if (savedLocationRef.current) {
            await rendition.display(savedLocationRef.current);
          } else {
            await rendition.display();
          }

          // Listen for location changes
          rendition.on('relocated', (location: { start: { cfi: string } }) => {
            if (location?.start?.cfi) {
              setCurrentLocation(location.start.cfi);

              // Calculate progress
              if (book.locations && typeof book.locations.percentageFromCfi === 'function') {
                const progressPercent = book.locations.percentageFromCfi(location.start.cfi);
                setProgress(Math.round(progressPercent * 100));
              }
            }
          });
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    initBook();

    return () => {
      if (bookRef.current) {
        bookRef.current.destroy();
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [bookId]);

  // Save progress debounced
  const saveProgress = useCallback(
    (cfi: string) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await progressApi.updateProgress(bookId, {
            progress_percent: progress,
            last_position: cfi,
          });
        } catch {
          // Silently fail
        }
      }, 1000);
    },
    [bookId, progress]
  );

  // Navigation
  const prevPage = async () => {
    if (renditionRef.current) {
      await renditionRef.current.prev();
    }
  };

  const nextPage = async () => {
    if (renditionRef.current) {
      await renditionRef.current.next();
    }
  };

  // Save on progress change
  useEffect(() => {
    if (currentLocation && progress > 0) {
      saveProgress(currentLocation);
    }
  }, [progress, currentLocation, saveProgress]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        prevPage();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        nextPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">Error Loading EPUB</p>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b bg-card px-4 py-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevPage}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            {progress}% complete
          </span>
          <Button variant="outline" size="sm" onClick={nextPage}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm">Font Size: {fontSize}%</span>
        </div>
      </div>

      {/* EPUB Viewer */}
      <div className="flex-1 overflow-hidden bg-muted/50">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">Loading EPUB...</p>
          </div>
        ) : (
          <div ref={viewerRef} className="h-full w-full" />
        )}
      </div>
    </div>
  );
}
