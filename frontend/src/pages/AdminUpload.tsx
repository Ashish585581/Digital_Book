import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, FileText, FileArchive, CheckCircle, AlertCircle, Loader2, BookOpen } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useBookStore } from '@/stores/bookStore';
import { booksApi } from '@/api/books';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { CLASS_GRADE_OPTIONS } from '@/types/book';
import { formatFileSize } from '@/utils/cn';

interface UploadFile {
  file: File;
  id: string;
  title: string;
  authors: string;
  classGrade: string;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
}

const FileIcon = ({ type }: { type: string }) => {
  if (type === 'application/epub+zip') {
    return <FileArchive className="h-10 w-10 text-amber-500" />;
  }
  return <FileText className="h-10 w-10 text-red-500" />;
};

export function AdminUploadPage() {
  const navigate = useNavigate();
  const { uploadBook, isLoading, error } = useBookStore();

  const [uploads, setUploads] = useState<UploadFile[]>([]);
  const [currentUploadId, setCurrentUploadId] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map((file) => {
      const fileName = file.name.replace(/\.[^/.]+$/, '');
      return {
        file,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: fileName,
        authors: '',
        classGrade: '',
        progress: 0,
        status: 'pending',
      };
    });

    setUploads((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/epub+zip': ['.epub'],
    },
    multiple: true,
  });

  const removeFile = (id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  };

  const updateUpload = (id: string, updates: Partial<UploadFile>) => {
    setUploads((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...updates } : u))
    );
  };

  const handleUpload = async (id: string) => {
    const upload = uploads.find((u) => u.id === id);
    if (!upload || !upload.title || !upload.authors || !upload.classGrade) {
      return;
    }

    setCurrentUploadId(id);
    updateUpload(id, { status: 'uploading', progress: 0 });

    try {
      await booksApi.uploadBook(
        upload.file,
        { title: upload.title, authors: upload.authors, class_grade: upload.classGrade },
        (progress) => updateUpload(id, { progress })
      );
      updateUpload(id, { status: 'complete', progress: 100 });
    } catch (err) {
      updateUpload(id, {
        status: 'error',
        error: (err as Error).message || 'Upload failed',
      });
    } finally {
      setCurrentUploadId(null);
    }
  };

  const handleUploadAll = async () => {
    const pendingUploads = uploads.filter(
      (u) => u.status === 'pending' && u.title && u.authors && u.classGrade
    );

    for (const upload of pendingUploads) {
      await handleUpload(upload.id);
    }
  };

  const hasPendingUploads = uploads.some(
    (u) => u.status === 'pending' && u.title && u.authors && u.classGrade
  );

  const allComplete = uploads.length > 0 && uploads.every((u) => u.status === 'complete');
  const hasErrors = uploads.some((u) => u.status === 'error');

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="border-b bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Upload Books</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload PDF or EPUB files to the library
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/')}>
            Cancel
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-3 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          )}

          {/* Success Banner */}
          {allComplete && (
            <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4 text-sm text-green-700">
              <CheckCircle className="h-5 w-5" />
              All files uploaded successfully!
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                Go to Library
              </Button>
            </div>
          )}

          {/* Drop Zone */}
          <div
            {...getRootProps()}
            className={`relative cursor-pointer rounded-xl border-2 border-dashed p-8 transition-all ${
              isDragActive
                ? 'border-primary bg-primary/5 scale-[1.02]'
                : 'border-border hover:border-primary/50 hover:bg-muted/30'
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <p className="mt-4 text-lg font-medium">
                {isDragActive ? 'Drop files here...' : 'Drag and drop files here'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                or click to select multiple PDF or EPUB files
              </p>
              <div className="mt-4 flex gap-2">
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">PDF</span>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">EPUB</span>
              </div>
            </div>
          </div>

          {/* Upload Queue */}
          {uploads.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Upload Queue ({uploads.length})</h2>
                {hasPendingUploads && (
                  <Button onClick={handleUploadAll} disabled={!!currentUploadId}>
                    {currentUploadId ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      'Upload All'
                    )}
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                {uploads.map((upload) => (
                  <div
                    key={upload.id}
                    className={`rounded-xl border bg-card p-4 shadow-sm ${
                      upload.status === 'error' ? 'border-destructive' : ''
                    } ${upload.status === 'complete' ? 'border-green-500' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      {/* File Icon */}
                      <FileIcon type={upload.file.type} />

                      {/* File Info & Form */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{upload.file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(upload.file.size)}
                          </p>
                        </div>

                        {upload.status === 'error' && (
                          <p className="text-sm text-destructive">{upload.error}</p>
                        )}

                        {upload.status !== 'complete' && upload.status !== 'uploading' && (
                          <div className="grid gap-3 sm:grid-cols-3">
                            <div>
                              <Input
                                placeholder="Title *"
                                value={upload.title}
                                onChange={(e) => updateUpload(upload.id, { title: e.target.value })}
                                className="h-9"
                              />
                            </div>
                            <div>
                              <Input
                                placeholder="Author(s) *"
                                value={upload.authors}
                                onChange={(e) => updateUpload(upload.id, { authors: e.target.value })}
                                className="h-9"
                              />
                            </div>
                            <Select
                              value={upload.classGrade}
                              onValueChange={(value) => updateUpload(upload.id, { classGrade: value })}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Class *" />
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
                        )}

                        {/* Progress Bar */}
                        {(upload.status === 'uploading' || upload.status === 'complete') && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>
                                {upload.status === 'complete' ? 'Complete' : 'Uploading...'}
                              </span>
                              <span>{upload.progress}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  upload.status === 'complete' ? 'bg-green-500' : 'bg-primary'
                                }`}
                                style={{ width: `${upload.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {upload.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpload(upload.id)}
                            disabled={
                              !upload.title ||
                              !upload.authors ||
                              !upload.classGrade ||
                              !!currentUploadId
                            }
                          >
                            Upload
                          </Button>
                        )}
                        {upload.status === 'uploading' && (
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        )}
                        {upload.status === 'complete' && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        {upload.status === 'error' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpload(upload.id)}
                          >
                            Retry
                          </Button>
                        )}
                        {(upload.status === 'pending' || upload.status === 'error') && (
                          <button
                            onClick={() => removeFile(upload.id)}
                            className="rounded-full p-1 hover:bg-muted"
                          >
                            <X className="h-5 w-5 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {uploads.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-16 w-16 text-muted-foreground/30" />
              <p className="mt-4 text-lg font-medium">No files queued</p>
              <p className="text-sm text-muted-foreground">
                Drop some files above to start uploading
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
