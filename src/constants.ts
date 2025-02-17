import { config } from 'dotenv';
config();

export const SETTINGS = {
  PORT: process.env.PORT ?? 3000,
  MONGODB_URI: process.env.MONGODB_URI ?? 'mongodb://localhost:27017',
  MAIL_PASSWORD: process.env.MAIL_PASSWORD as string,
  JWT_SECRET: process.env.JWT_SECRET as string,
  JWT_EXPIRY: process.env.JWT_EXPIRY as string,
  AC_SECRET: process.env.AC_SECRET as string,
  AC_EXPIRY: process.env.AC_EXPIRY as string,
  RT_SECRET: process.env.RT_SECRET as string,
  RT_EXPIRY: process.env.RT_EXPIRY as string,
  TTL: process.env.TTL ?? 10000,
  LIMIT: process.env.LIMIT ?? 5,
};

export const PATHS = {
  AUTH: 'auth',
  BLOGS: 'blogs',
  POSTS: 'posts',
  USERS: 'users',
  TESTING: 'testing',
};

export const ERRORS = {
  USER_NOT_FOUND: 'User not found',
  BLOG_NOT_FOUND: 'Blog not found',
  POST_NOT_FOUND: 'Post not found',
};
