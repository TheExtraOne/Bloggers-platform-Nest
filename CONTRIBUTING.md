# Contributing to Bloggers Platform

Thank you for your interest in contributing to the Bloggers Platform! This document provides guidelines and information for contributors.

## Table of Contents

- [Development Guidelines](#development-guidelines)
- [Code Style](#code-style)
- [Development Process](#development-process)
- [Troubleshooting](#troubleshooting)
- [FAQs](#faqs)

## Development Guidelines

### Code Style

#### TypeScript Guidelines

- Use TypeScript strict mode
- Prefer interfaces over types
- Use enums for constants
- Implement proper error handling
- Write meaningful comments

#### Naming Conventions

- Use PascalCase for classes and interfaces
- Use camelCase for variables and functions
- Use UPPER_CASE for constants
- Use kebab-case for files
- Prefix interfaces with 'I'

### File Organization

```
src/modules/feature/
├── api/                 # Controllers and DTOs
│   ├── controllers/
│   ├── dto/
│   └── swagger/
├── app/                 # Use cases and business logic
│   ├── commands/
│   ├── queries/
│   └── use-cases/
├── domain/             # Domain models and interfaces
│   ├── entities/
│   └── interfaces/
└── infrastructure/     # Implementation details
    ├── repositories/
    └── services/
```

## Development Process

1. **Fork and Clone**

   - Fork the repository
   - Clone your fork locally
   - Add upstream remote

2. **Branch**

   - Create a feature branch from main
   - Use descriptive branch names (e.g., `feature/add-quiz-timer`)

3. **Develop**

   - Write tests first
   - Follow code style guidelines
   - Keep commits atomic
   - Write meaningful commit messages

4. **Test**

   - Ensure all tests pass
   - Add new tests for new features
   - Check code coverage

5. **Submit**
   - Push to your fork
   - Create a Pull Request
   - Fill out the PR template
   - Request review

## Troubleshooting

### Common Issues

#### Database Connection Issues

```bash
# Check database status
pg_isready -h localhost -p 5432

# Reset database
yarn migration:revert
yarn migration:run

# Clear database
yarn db:drop
yarn db:create
yarn migration:run
```

#### Authentication Problems

1. **JWT Token Issues**

   - Verify token expiration
   - Check JWT_SECRET in .env
   - Clear browser cookies
   - Regenerate refresh token

2. **Login Problems**
   - Verify credentials
   - Check database connection
   - Review rate limiting
   - Check user status

#### Game-Related Issues

1. **Game Not Starting**

   - Verify both players connected
   - Check question availability
   - Review game status
   - Check user permissions

2. **Answer Submission Problems**
   - Verify game is active
   - Check answer format
   - Review timing constraints
   - Validate user participation

### Debug Tips

1. Enable debug logging:

   ```env
   LOG_LEVEL=debug
   ```

2. Use transaction logging:

   ```typescript
   @Transaction()
   async someMethod() {
     this.logger.debug('Transaction started');
     // ... your code
   }
   ```

3. Monitor performance:
   ```typescript
   console.time('operation');
   await someOperation();
   console.timeEnd('operation');
   ```
