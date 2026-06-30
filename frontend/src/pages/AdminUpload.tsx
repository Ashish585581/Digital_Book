import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, FileText } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useBookStore } from '@/stores/bookStore';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { CLASS_GRADE_OPTIONS } from '@/types/book';

export function AdminUploadPage() {
  const navigate = useNavigate();
  const { uploadBook, isLoading, error } = useBookStore();

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [classGrade, setClassGrade] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);

      // Auto-fill title from filename
      const fileName = selectedFile.name.replace(/\.[^/.]+$/, '');
      if (!title) {
        setTitle(fileName);
      }
    }
  }, [title]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/epub+zip': ['.epub'],
    },
    multiple: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !title || !authors || !classGrade) {
      return;
    }

    try {
      await uploadBook(file, title, authors, classGrade);
      navigate('/');
    } catch {
      // Error handled in store
    }
  };

  const clearFile = () => {
    setFile(null);
    setUploadProgress(0);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="border-b bg-card p-6">
        <h1 className="text-2xl font-bold">Upload Book</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload PDF or EPUB files for the library
        </p>
      </header>

      {/* Form */}
      <main className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-2xl">
          {error && (
            <div className="mb-6 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Drop Zone */}
            <div>
              <Label>Book File</Label>
              <div
                {...getRootProps()}
                className={`mt-2 flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
                  isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <input {...getInputProps()} />
                {file ? (
                  <div className="flex items-center gap-4">
                    <FileText className="h-12 w-12 text-primary" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFile();
                      }}
                      className="ml-4 rounded-full p-1 hover:bg-muted"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      {isDragActive
                        ? 'Drop the file here...'
                        : 'Drag and drop a PDF or EPUB file here, or click to select'}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter book title"
                required
              />
            </div>

            {/* Authors */}
            <div>
              <Label htmlFor="authors">Author(s)</Label>
              <Input
                id="authors"
                value={authors}
                onChange={(e) => setAuthors(e.target.value)}
                placeholder="Enter author name(s)"
                required
              />
            </div>

            {/* Class Grade */}
            <div>
              <Label htmlFor="classGrade">Class</Label>
              <Select value={classGrade} onValueChange={setClassGrade} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {CLASS_GRADE_OPTIONS.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <Button type="submit" className="flex-1" disabled={isLoading || !file}>
                {isLoading ? 'Uploading...' : 'Upload Book'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}