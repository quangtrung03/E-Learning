// Shared Course-related TypeScript types

export interface Instructor {
  _id: string;
  name: string;
  email?: string;
  avatar?: string;
  bio?: string;
}

export interface Lesson {
  _id: string;
  title: string;
  description?: string;
  duration: number;
  order: number;
  isPreview?: boolean;
  content?: string;
  contentType?: 'text' | 'video' | 'pdf' | 'quiz';
  // Legacy field (backward compatible)
  videoUrl?: string;
  // New Cloudinary video metadata
  video?: {
    provider?: string;
    publicId?: string;
    url?: string;
    secureUrl?: string;
    duration?: number;
    format?: string;
    width?: number;
    height?: number;
    size?: number;
    thumbnailUrl?: string;
    status?: 'uploading' | 'processing' | 'ready' | 'failed';
    uploadedAt?: string;
    transformations?: Array<{
      quality: string;
      url: string;
      width: number;
      height: number;
    }>;
  };
  type?: 'video' | 'text' | 'assignment';
  resources?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
}

export interface Student {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Enrollment {
  _id: string;
  user: Student;
  course: string;
  enrolledAt: Date;
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  progress: number;
  completedAt?: Date;
  lastAccessedAt?: Date;
  totalTimeSpent?: number;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  finalPrice?: number;
  discount?: number;
  thumbnail?: string;
  duration: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  isPublished?: boolean;
  instructor: Instructor;
  lessons: Lesson[] | string[];
  // Virtual field - array of Enrollment documents
  students?: Enrollment[];
  // Virtual field - count only
  totalStudents?: number;
  rating?: {
    average: number;
    count: number;
  };
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
  rejectionReason?: string;
  requirements?: string[];
  whatYouWillLearn?: string[];
  tags?: string[];
  // Soft delete fields (only visible when explicitly selected)
  deleted?: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  // For enrolled courses view
  enrolledAt?: Date;
  isDeleted?: boolean;
}
