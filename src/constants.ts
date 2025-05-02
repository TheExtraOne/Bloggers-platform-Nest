export const PATHS = {
  AUTH: 'auth',
  SA_BLOGS: 'sa/blogs',
  SA_QUESTIONS: 'sa/quiz/questions',
  PAIR_GAME_QUIZ_PAIRS: 'pair-game-quiz/pairs',
  PAIR_GAME_QUIZ_USERS: 'pair-game-quiz/users',
  BLOGS: 'blogs',
  COMMENTS: 'comments',
  POSTS: 'posts',
  SA_USERS: 'sa/users',
  TESTING: 'testing',
  SECURITY: 'security',
};

export const ERRORS = {
  USER_NOT_FOUND: 'User not found',
  BLOG_NOT_FOUND: 'Blog not found',
  POST_NOT_FOUND: 'Post not found',
  COMMENT_NOT_FOUND: 'Comment not found',
  LIKE_NOT_FOUND: 'Like not found',
  SESSION_NOT_FOUND: 'Session not found',
  QUESTION_NOT_FOUND: 'Question not found',
  GAME_NOT_FOUND: 'Game not found',
  PLAYER_PROGRESS_NOT_FOUND: 'Player progress not found',
};

export enum LOCK_MODES {
  PESSIMISTIC_WRITE = 'pessimistic_write',
  PESSIMISTIC_READ = 'pessimistic_read',
}
