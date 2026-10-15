export interface CourseAuthor {
  name: string;
  photo?: string | null;
}

export interface CourseContent {
  id: number;
  course_id: number;
  title: string;
  youtube: string;
  created_at?: string;
  updated_at?: string;
  my_status_finished?: boolean;
}

export interface CourseRating {
  name: string;
  ratings: number;
  comment?: string | null;
}

export interface Course {
  id: number;
  user_id: number;
  title: string;
  description?: string | null;
  cover?: string | null;
  created_at?: string;
  updated_at?: string;
  author?: CourseAuthor | null;
  students?: number[];
  total_contents?: number;
  avg_ratings?: string | number | null;
}

export interface CourseDetail extends Course {
  contents?: CourseContent[];
  ratings?: CourseRating[];
  my_percentage_finished?: string | number | null;
}

export type ContentStatus = 0 | 1;
