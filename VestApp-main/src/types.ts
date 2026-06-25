import { FieldValue } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  handle: string;
  photoURL?: string;
  avatarEdited?: boolean;
  coverURL?: string;
  bio: string;
  level: number;
  xp: number;
  followersCount: number;
  followingCount: number;
  createdAt: FieldValue;
  studentType?: string;
  studyTime?: string;
  studyGoal?: string;
  isVerified?: boolean;
  totalFocusSeconds?: number;
  isAmbassador?: boolean;
  vEST?: number;
  streak?: number;
  simuladosCount?: number;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorPhoto: string;
  content: string;
  imageURL?: string;
  videoURL?: string;
  imageURLs?: string[];
  videoURLs?: string[];
  likesCount: number;
  commentsCount: number;
  createdAt: any;
  subject?: string;
  type?: string;
  repostOfId?: string;
  quoteOfId?: string;
  repostsCount: number;
  mediaURL?: string;
  mediaType?: string;
  originalPost?: any;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorPhoto: string;
  text: string;
  createdAt: any;
}
