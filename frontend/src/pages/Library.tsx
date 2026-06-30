import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, BookOpen } from 'lucide-react';
import { useBookStore } from '@/stores/bookStore';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { CLASS_GRADE_OPTIONS } from '@/types/book';
import { formatFileSize } from '@/utils/cn';

export function LibraryPage() {
  const {
    books,
    total,
    page,
    pages,
    isLoading,
    filters,
    fetchBooks,
    setFilters,
  } = useBookStore();

  const [search, setSearch] = useState('');
  const [classGrade, setClassGrade] = useState<string>('');
  const [bookType, setBookType] = useState<string>('');

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleSearch = () => {
    setFilters({
      ...filters,
      search: search || undefined,
      class_grade: classGrade || undefined,
      book_type: (bookType as 'PDF' | 'EPUB') || undefined,
      page: 1,
    });
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="border-b bg-card p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Library</h1>
          <p className="text-sm text-muted-foreground">{total} books</p>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by title or author..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
          </div>

          {/* Class Grade Filter */}
          <Select value={classGrade} onValueChange={setClassGrade}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Classes</SelectItem>
              {CLASS_GRADE_OPTIONS.map((grade) => (
                <SelectItem key={grade} value={grade}>
                  {grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Book Type Filter */}
          <Select value={bookType} onValueChange={setBookType}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              <SelectItem value="PDF">PDF</SelectItem>
              <SelectItem value="EPUB">EPUB</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleSearch}>
            <Filter className="mr-2 h-4 w-4" />
            Apply
          </Button>
        </div>
      </header>

      {/* Book Grid */}
      <main className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : books.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">
            <BookOpen className="h-16 w-16 text-muted-foreground/50" />
            <p className="mt-4 text-lg text-muted-foreground">No books found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or upload some books.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {books.map((book) => (
                <Link
                  key={book.id}
                  to={`/books/${book.id}`}
                  className="group rounded-lg border bg-card p-4 transition-shadow hover:shadow-lg"
                >
                  {/* Book Cover */}
                  <div className="aspect-[3/4] overflow-hidden rounded-md bg-muted">
                    {book.thumbnail ? (
                      <img
                        src={book.thumbnail}
                        alt={book.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <BookOpen className="h-12 w-12 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>

                  {/* Book Info */}
                  <div className="mt-4">
                    <h3 className="font-semibold line-clamp-2">{book.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{book.authors}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        {book.class_grade}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {book.book_type}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(book.file_size)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {pages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= pages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}