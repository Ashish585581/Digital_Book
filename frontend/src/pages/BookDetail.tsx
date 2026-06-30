import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Edit, Trash2 } from 'lucide-react';
import { useBookStore } from '@/stores/bookStore';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/common/Button';
import { formatFileSize, formatDate } from '@/utils/cn';
import { booksApi } from '@/api/books';

export function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentBook, fetchBook, deleteBook, isLoading } = useBookStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (id) {
      fetchBook(Number(id));
    }
  }, [id]);

  const handleRead = () => {
    if (currentBook) {
      navigate(`/read/${currentBook.id}`);
    }
  };

  const handleDelete = async () => {
    if (id && window.confirm('Are you sure you want to delete this book?')) {
      await deleteBook(Number(id));
      navigate('/');
    }
  };

  if (isLoading || !currentBook) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background p-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">Book Details</h1>
        {isAdmin && (
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isLoading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="p-6">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-8 md:grid-cols-3">
            {/* Cover */}
            <div className="md:col-span-1">
              <div className="aspect-[3/4] overflow-hidden rounded-lg bg-muted">
                {currentBook.thumbnail ? (
                  <img
                    src={currentBook.thumbnail}
                    alt={currentBook.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <BookOpen className="h-24 w-24 text-muted-foreground/50" />
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="md:col-span-2">
              <h1 className="text-3xl font-bold">{currentBook.title}</h1>
              <p className="mt-2 text-xl text-muted-foreground">{currentBook.authors}</p>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  {currentBook.class_grade}
                </span>
                <span className="rounded-full bg-secondary px-3 py-1 text-sm">
                  {currentBook.book_type}
                </span>
              </div>

              <dl className="mt-8 space-y-4">
                <div className="flex">
                  <dt className="w-32 font-medium">File Name</dt>
                  <dd className="text-muted-foreground">{currentBook.file_name}</dd>
                </div>
                <div className="flex">
                  <dt className="w-32 font-medium">File Size</dt>
                  <dd className="text-muted-foreground">{formatFileSize(currentBook.file_size)}</dd>
                </div>
                <div className="flex">
                  <dt className="w-32 font-medium">Added On</dt>
                  <dd className="text-muted-foreground">{formatDate(currentBook.created_at)}</dd>
                </div>
              </dl>

              <div className="mt-8">
                <Button size="lg" onClick={handleRead} className="w-full md:w-auto">
                  <BookOpen className="mr-2 h-5 w-5" />
                  Read Book
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}