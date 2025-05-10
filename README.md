# Bloggers Platform

[![NestJS](https://img.shields.io/badge/NestJS-v11-red.svg)](https://nestjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v14-blue.svg)](https://www.postgresql.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.7-blue.svg)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

A modern, feature-rich blogging platform built with NestJS, providing a robust backend for managing blogs, posts, comments, and user interactions. The platform includes an advanced Quiz Game system for user engagement and interactive learning, along with a comprehensive notification system.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
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
- Real-time user interactions and notifications
- Comprehensive API documentation with Swagger
- Extensive test coverage with Jest
- Transaction management
- Performance optimized database queries
- Email notification system

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
    - Game completion events
  - Answer Processing
    - Real-time answer validation
    - Score calculation
    - Progress tracking

- **Post System**

  - Rich post creation and editing
  - Post categorization
  - Advanced post querying and filtering

- **User Interactions**

  - Like/Dislike system for posts and comments
  - Comment threading
  - User engagement tracking
  - Real-time notifications
  - Email notifications for important events

- **Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control
  - Session management
  - Secure password handling
  - Rate limiting
  - Basic authentication support

## Technology Stack

- **Backend Framework**:

  - NestJS v11.0
  - Express.js (underlying)

- **Database**:

  - PostgreSQL v14+
  - TypeORM v0.3.21
  - Custom naming strategies

- **Authentication & Security**:

  - Passport.js v0.7.0
  - JWT
  - Basic Auth
  - bcrypt for password hashing

- **Email & Notifications**:

  - Nodemailer v6.10
  - @nestjs-modules/mailer v2.0

- **Testing**:

  - Jest v29.7
  - Supertest v7.0
  - E2E and Unit testing support

- **Development Tools**:
  - TypeScript v5.7
  - ESLint v9.18
  - Prettier v3.4
  - SWC for fast compilation

## Getting Started

### Prerequisites

- Node.js 18 or higher
- PostgreSQL 14 or higher
- Yarn package manager
- Git

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd bloggers-platform-nest
   ```

2. Install dependencies:

   ```bash
   yarn install
   ```

3. Create a PostgreSQL database

### Configuration

1. Set up environment variables:

   ```bash
   cp .env.example .env
   ```

2. Configure the following in your .env file:

   - Database connection details
   - JWT secret
   - Email service credentials
   - API rate limiting parameters

3. Run database migrations:
   ```bash
   yarn apply-migrations
   ```

### Running the App

```bash
# development
yarn start:dev

# debug mode
yarn start:debug

# production mode
yarn start:prod
```

## Project Structure

```
src/
├── core/            # Core functionality and configurations
├── db/              # Database related code
├── modules/
│   ├── bloggers-platform/    # Core blogging functionality
│   ├── notifications/        # Notification system
│   ├── quiz/                # Quiz game system
│   └── user-accounts/       # User management
├── db/                      # Database configurations
├── common/                  # Shared utilities
└── main.ts                 # Application entry point
```

## Architecture & Patterns

- **Clean Architecture**: Separation of concerns with layers
- **CQRS Pattern**: Command Query Responsibility Segregation
- **Repository Pattern**: Data access abstraction
- **Event-Driven Architecture**: Using NestJS event emitter
- **Domain-Driven Design**: Structured around business domains

## API Documentation

API documentation is automatically generated using Swagger/OpenAPI. Access it at:

```
http://localhost:${PORT}/api/swagger
```

## Testing

```bash
# unit tests
yarn test

# e2e tests
yarn test:e2e

# test coverage
yarn test:cov
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on code of conduct, development process, and guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
