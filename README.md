# Bloggers Platform

[![NestJS](https://img.shields.io/badge/NestJS-v11-red.svg)](https://nestjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v14-blue.svg)](https://www.postgresql.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5-blue.svg)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

A modern, feature-rich blogging platform built with NestJS, providing a robust backend for managing blogs, posts, comments, and user interactions. The platform includes an advanced Quiz Game system for user engagement and interactive learning.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the App](#running-the-app)
- [Project Structure](#project-structure)
- [Architecture & Patterns](#architecture--patterns)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## Overview

This platform combines traditional blogging capabilities with interactive features like quiz games and real-time user interactions. Built using modern architecture patterns and best practices, it provides a scalable and maintainable solution for content creation and user engagement.

### Key Highlights

- Clean Architecture with CQRS pattern
- Advanced Quiz Game system with pair matching
- Real-time user interactions
- Comprehensive API documentation
- Extensive test coverage
- Transaction management
- Performance optimized database queries

## Features

- **Blog Management**

  - Create, read, update, and delete blogs
  - Blog ownership and permissions
  - Blog post management

- **Quiz System**

  - Questions Management
    - Create, read, update, and delete quiz questions
    - Question publishing workflow
    - Answer validation
    - Comprehensive filtering and sorting
  - Pair Game Quiz
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

## Technology Stack

- **Backend Framework**: [NestJS](https://nestjs.com/) (v11)
- **Database**: PostgreSQL with TypeORM
- **Authentication**: Passport.js, JWT, Basic Auth
- **API Documentation**: Swagger/OpenAPI
- **Testing**: Jest for unit and E2E testing
- **Other Tools**: CQRS, Class validators, date-fns, Nodemailer

## Getting Started

### Prerequisites

- Node.js 18 or higher
- PostgreSQL 14 or higher
- Yarn package manager

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/Bloggers-platform-Nest.git
cd Bloggers-platform-Nest
```

2. Install dependencies:

```bash
yarn install
```

3. Configure environment:

   - Copy `.env.development` to `.env`
   - Update the variables

4. Setup database:

```bash
yarn migration:run
```

### Running the App

```bash
# Development
yarn start:dev

# Production
yarn start:prod

# Debug mode
yarn start:debug
```

## Project Structure

```
src/
├── core/            # Core functionality and configurations
├── db/              # Database related code
├── modules/
│   ├── user-accounts/     # User management
│   ├── bloggers-platform/ # Blogs, posts, comments
│   ├── notifications/     # Email notifications
│   └── quiz/             # Quiz functionality
├── setup/          # Application setup
└── testing/        # Testing utilities
```

## Architecture & Patterns

The application follows Clean Architecture principles with:

- **Domain-Driven Design**

  - Rich domain models
  - Clear bounded contexts
  - Value objects and entities

- **CQRS Pattern**

  - Separate command and query responsibilities
  - Optimized read/write operations
  - Event-driven architecture

- **Repository Pattern**
  - Data persistence abstraction
  - Optimized query operations
  - Transaction management

## API Documentation

Access the Swagger documentation at:

```
http://localhost:${PORT}/api/swagger
```

Features:

- Complete endpoint documentation
- Request/Response examples
- Authentication details
- Schema definitions

## Testing

```bash
# Unit tests
yarn test

# E2E tests
yarn test:e2e

# Test coverage
yarn test:cov
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on my code of conduct, development process, and guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
