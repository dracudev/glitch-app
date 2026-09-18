import { ReviewGame, ReviewStats } from '../reviews';

export interface SocialStats {
  followersCount: number;
  followingCount: number;
  reviewsCount: number;
  likesReceived: number;
}

export type ActivityType =
  | 'REVIEW_CREATED'
  | 'REVIEW_LIKED'
  | 'USER_FOLLOWED'
  | 'GAME_ADDED'
  | 'REVIEW_UPDATED';

export type ActivityTargetType = 'GAME' | 'USER' | 'REVIEW';

export interface ActivityUser {
  id: string;
  username: string;
  // displayName and avatar may be absent in some responses
  displayName?: string;
  avatar?: string;
}

// Feed-focused review payload (subset of full ReviewResponse)

export interface ReviewFeed {
  id: string;
  title?: string;
  // Optional review body or snippet included in feed items
  content?: string;
  rating: number;
  game: ReviewGame;
  stats: ReviewStats;
}

export interface ActivityItem {
  id: string;
  type: ActivityType;
  userId: string;
  user: ActivityUser;
  targetId?: string;
  targetType?: ActivityTargetType;
  // Optional structured payloads for common activity types
  review?: ReviewFeed;
  followedUser?: ActivityUser;

  // Generic metadata for miscellaneous activity data
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface ActivityFeedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ActivityFeedResponse {
  items: ActivityItem[];
  meta: ActivityFeedMeta;
}

export interface ActivityFeedQuery {
  page?: number;
  limit?: number;
  type?: ActivityType;
  targetType?: ActivityTargetType;
  since?: Date;
  until?: Date;
}

export interface FollowResponse {
  isFollowing: boolean;
}

export interface MutualFollowsResponse {
  mutualFollows: string[];
}

export interface FollowSuggestion {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  followersCount: number;
  mutualFollowsCount: number;
  commonGenres?: string[];
  commonGames?: string[];
}

export interface FollowSuggestionsQuery {
  limit?: number;
  excludeFollowed?: boolean;
}

export interface FollowUserRequest {
  userId: string;
}

export interface UnfollowUserRequest {
  userId: string;
}

export interface SocialRelationship {
  isFollowing: boolean;
  isFollowedBy: boolean;
  isMutual: boolean;
  followedAt?: Date;
}

export interface SocialProfile {
  userId: string;
  stats: SocialStats;
  relationship?: SocialRelationship;
  recentActivity?: ActivityItem[];
}
