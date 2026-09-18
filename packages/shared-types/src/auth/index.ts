export * from "./validations";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: string;
  avatar?: string;
  bio?: string;
  createdAt: Date;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export type UserRole = "USER" | "ADMIN" | "MODERATOR";

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}
