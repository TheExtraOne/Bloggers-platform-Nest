# Bloggers Platform

A modern, feature-rich blogging platform built with NestJS, providing a robust backend for managing blogs, posts, comments, and user interactions.

## Features

- **Blog Management**
  - Create, read, update, and delete blogs
  - Blog ownership and permissions
  - Blog post management

- **Post System**
  - Rich post creation and editing
  - Post categorization
  - Advanced post querying and filtering

- **User Interactions**
  - Like/Dislike system for posts and comments
  - Comment threading
  - User engagement tracking

- **Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control
  - Session management
  - Secure password handling

- **API Features**
  - RESTful API design
  - Swagger/OpenAPI documentation
  - Rate limiting
  - Pagination support

## Technology Stack

- **Backend Framework**: [NestJS](https://nestjs.com/) (v11)
- **Database**: PostgreSQL with TypeORM
- **Authentication**: 
  - Passport.js
  - JWT
  - Basic Auth
- **API Documentation**: Swagger/OpenAPI
- **Testing**:
  - Jest for unit testing
  - E2E testing support
- **Other Tools & Libraries**:
  - CQRS pattern implementation
  - Class validators
  - Date handling with date-fns
  - Email sending with Nodemailer

## Prerequisites

- Node.js (v18 or higher recommended)
- PostgreSQL
- Yarn package manager

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bloggers-platform-nest
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Configure your database and other environment variables

4. **Database Setup**
   ```bash
   # Run TypeORM migrations
   yarn typeorm migration:run
   ```

5. **Start the application**
   ```bash
   # Development
   yarn start:dev

   # Production
   yarn start:prod
   ```

## Testing

```bash
# Unit tests
yarn test

# E2E tests
yarn test:e2e

# Test coverage
yarn test:cov
```

## API Documentation

Once the application is running locally, you can access the Swagger documentation at:
```
http://localhost:3000/api/docs
```

You can also view the API documentation for the deployed version at:
```
https://bloggers-platform-nest-six.vercel.app/swagger
```

## Project Structure

```
src/
├── core/              # Core functionality and base classes
├── modules/
│   ├── bloggers-platform/  # Main business logic
│   │   ├── blogs/
│   │   ├── posts/
│   │   ├── comments/
│   │   └── likes/
│   └── user-accounts/      # User management
├── shared/            # Shared utilities and helpers
└── main.ts           # Application entry point
```

## Security

- Implements rate limiting for API endpoints
- Uses bcrypt for password hashing
- JWT-based authentication
- Input validation and sanitization
- Session management and device tracking

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the [MIT License](LICENSE).
