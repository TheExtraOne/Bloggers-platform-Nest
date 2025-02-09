export const SETTINGS = {
  GLOBAL_PREFIX: 'api',
  PORT: process.env.PORT || 3000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017',
};

export const PATHS = {
  BLOGS: 'blogs',
  USERS: 'users',
  TESTING: 'testing',
};

export const ERRORS = {
  USER_NOT_FOUND: 'User not found',
  BLOG_NOT_FOUND: 'Blog not found',
};
