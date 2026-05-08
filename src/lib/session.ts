import { SessionOptions } from "iron-session";

export interface UserProfile {
  sub: string;
  name?: string;
  email?: string;
  preferredUsername?: string;
  realmRoles: string[];
}

export interface SessionData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userProfile: UserProfile;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "neuro-consult-session",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  },
};
