# Bloggers Platform

A modern, feature-rich blogging platform built with NestJS, providing a robust backend for managing blogs, posts, comments, and user interactions.

## Features

- **Blog Management**

  - Create, read, update, and delete blogs
  - Blog ownership and permissions
  - Blog post management

- **Quiz System**

  - Questions Management:
    - Create, read, update, and delete quiz questions
    - Question publishing workflow
    - Answer validation
    - Comprehensive filtering and sorting
  - Pair Game Quiz:
    - Real-time pair matching system
    - Active game tracking and management
    - Player progress and scoring
    - Question randomization
    - Game state persistence
    - Participant validation

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

## Project Structure

```
├── migrations/           # Database migrations
├── src/
│   ├── core/            # Core functionality and configurations
│   ├── db/              # Database related code
│   ├── env/            # Environment configurations
│   ├── modules/        # Feature modules
│   │   ├── user-accounts/
│   │   ├── bloggers-platform/
│   │   ├── notifications/
│   │   └── quiz/       # Quiz functionality
│   │       ├── questions/    # Question management
│   │       │   ├── api/     # Question controllers and DTOs
│   │       │   ├── app/     # Question use cases and queries
│   │       │   └── domain/  # Question entities
│   │       └── pair-games/   # Pair game quiz functionality
│   │           ├── api/      # Game controllers and DTOs
│   │           ├── app/      # Game logic, commands and queries
│   │           ├── domain/   # Game entities and types
│   │           └── infrastructure/  # Game repositories
│   ├── setup/         # Application setup and configuration
│   └── testing/       # Testing utilities
├── test/              # Test files
│   ├── helpers/       # Test helpers
│   └── mock/         # Mock data for testing
└── swagger-static/    # Generated Swagger documentation
```

## Architecture & Patterns

- **Modular Architecture**: The application is organized into feature modules, each responsible for specific business functionality.

- **CQRS Pattern**: Implements Command Query Responsibility Segregation for better separation of read and write operations.

- **Repository Pattern**: Used with TypeORM for database operations.

  - Implements soft delete for data integrity
  - Maintains clear separation between query and command repositories

- **Dependency Injection**: Leverages NestJS's powerful DI container.

  - Modules register their providers and exports
  - Services are injected where needed

- **DTO Pattern**: Data Transfer Objects for type-safe data validation.
  - Input validation using class-validator
  - Swagger documentation using class-transformer

## Security Features

- **Rate Limiting**: Protects against brute force attacks
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Using bcrypt for secure password storage
- **Environment Configuration**: Secure configuration management
- **CORS Protection**: Configured cross-origin resource sharing

## Database Management

- Uses TypeORM with PostgreSQL
- Implements migrations for database version control
- Supports both synchronous and asynchronous database operations
- Snake case naming strategy for database columns

### Data Management

```bash
# Run TypeORM migrations
yarn typeorm migration:run

# Generate new migration
yarn typeorm migration:generate

# Revert last migration
yarn typeorm migration:revert
```

## Development Setup

1. **Prerequisites**:

   - Node.js
   - PostgreSQL, TypeORM
   - Yarn

2. **Environment Variables**:
   - Configure your environment variables in `.env` file
   - Database connection settings
   - JWT secrets
   - API configuration

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

### Test Coverage

The application includes comprehensive test coverage across all modules:

- **Unit Tests**: Testing individual components and business logic
- **Integration Tests**: Testing module interactions and database operations
- **E2E Tests**: Testing complete user flows and API endpoints
  - Question management workflows
  - Pair game quiz scenarios:
    - Game creation and matching
    - Player connections and validation
    - Game state transitions
    - Answer submission and scoring

### Running Tests

```bash
# Unit tests
yarn test

# E2E tests
yarn test:e2e

# Test specific module
yarn test:e2e test/questions.e2e-spec.ts

# Test coverage
yarn test:cov
```

Test helpers are available in the `test/helpers` directory to facilitate testing of specific modules and functionalities.

## API Documentation

- Swagger documentation is automatically generated and available at `/api` endpoint when running in development mode
- Static documentation is generated in the `swagger-static` directory

Once the application is running locally, you can access the Swagger documentation at:

```
http://localhost:3000/api/docs
```

You can also view the API documentation for the deployed version at:

```
https://bloggers-platform-nest-six.vercel.app/swagger
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the [MIT License](LICENSE).
