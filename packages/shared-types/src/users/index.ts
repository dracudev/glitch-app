import type { UserRole } from "../auth";

export interface UserStats {
  reviewsCount: number;
  followersCount: number;
  followingCount: number;
}

export interface UserResponse {
  id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  isPrivate: boolean;
  createdAt: Date;
  stats: UserStats;
}

export interface UserProfile extends UserResponse {
  email?: string;
  emailNotifications?: boolean;
  language?: string;
  timezone?: string;
  isFollowing?: boolean;
  isMutualFollow?: boolean;
}

export interface UpdateProfileRequest {
  displayName?: string;
  bio?: string;
  avatar?: string;
  location?: string;
  website?: string;
  isPrivate?: boolean;
  emailNotifications?: boolean;
  language?: string;
  timezone?: string;
}

export interface CreateUserRequest {
  email: string;
  username: string;
  password: string;
  displayName?: string;
  role?: UserRole;
}

export interface UpdateUserRequest {
  displayName?: string;
  bio?: string;
  avatar?: string;
  location?: string;
  website?: string;
  isPrivate?: boolean;
  emailNotifications?: boolean;
  language?: string;
  timezone?: string;
  role?: UserRole;
}

export interface UsersQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export type { UserRole } from "../auth";
