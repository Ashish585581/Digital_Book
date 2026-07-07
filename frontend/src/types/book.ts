export interface Book {
  id: number;
  title: string;
  authors: string;
  class_grade: string;
  book_type: 'PDF' | 'EPUB';
  thumbnail: string | null;
  file_size: number;
  file_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface BookDetail extends Book {
  file_name: string;
  updated_at: string;
}

export interface BookMetadataCreate {
  title: string;
  authors: string;
  class_grade: string;
  library_type?: 'school' | 'public';
}

export interface BookMetadataUpdate {
  title?: string;
  authors?: string;
  class_grade?: string;
  library_type?: 'school' | 'public';
}

export interface PaginatedBooks {
  items: Book[];
  total: number;
  page: number;
  pages: number;
}

export const CLASS_GRADE_OPTIONS = [
  'General',
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
  'Class 11',
  'Class 12',
] as const;

export type ClassGrade = typeof CLASS_GRADE_OPTIONS[number];