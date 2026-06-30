import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { PdfReader } from '@/components/reader/PdfReader';
import { EpubReader } from '@/components/reader/EpubReader';
import { booksApi } from '@/api/books';

export function ReaderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [bookType, setBookType] = useState<'PDF' | 'EPUB' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookType = async () => {
      if (!id) return;

      try {
        const book = await booksApi.getBook(Number(id));
        setBookType(book.book_type);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchBookType();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error || !id) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background">
        <p className="text-lg font-semibold text-destructive">Error</p>
        <p className="mt-2 text-sm text-muted-foreground">{error || 'Book not found'}</p>
        <Button className="mt-4" onClick={() => navigate('/')}>
          Back to Library
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-4 border-b bg-card px-4 py-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <span className="text-sm font-medium">Reading Mode</span>
      </header>

      {/* Reader */}
      <div className="flex-1">
        {bookType === 'PDF' ? (
          <PdfReader bookId={Number(id)} />
        ) : bookType === 'EPUB' ? (
          <EpubReader bookId={Number(id)} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">Unsupported book type</p>
          </div>
        )}
      </div>
    </div>
  );
}