import type { UserRole } from "../auth";

// Admin dashboard counters
export interface AdminStats {
  totalUsers: number;
  totalGames: number;
  totalReviews: number;
  publishedReviews: number;
  hiddenReviews: number;
  newUsersLast7Days: number;
  newReviewsLast7Days: number;
  usersByRole: Record<UserRole, number>;
}

// Admin user row. Unlike the public UserResponse, this carries email and role.
export interface AdminUser {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatar?: string;
  role: UserRole;
  isPrivate: boolean;
  createdAt: Date;
  stats: {
    reviewsCount: number;
    followersCount: number;
  };
}

export type AdminUsersSortBy = "username" | "email" | "createdAt" | "role";

export interface AdminUsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  sortBy?: AdminUsersSortBy;
  sortOrder?: "asc" | "desc";
}

export interface AdminCreateUserInput {
  email: string;
  username: string;
  password: string;
  displayName?: string;
  role?: UserRole;
}

export interface AdminUpdateUserInput {
  email?: string;
  username?: string;
  displayName?: string;
  password?: string;
  role?: UserRole;
  isPrivate?: boolean;
}
