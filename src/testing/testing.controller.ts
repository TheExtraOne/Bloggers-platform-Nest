import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { PATHS } from '../constants';
import { DeleteAllDataSwagger } from './swagger';
import { DataSource } from 'typeorm';

@Controller(PATHS.TESTING)
export class TestingController {
  constructor(private readonly dataSource: DataSource) {}

  @Delete('all-data')
  @HttpCode(HttpStatus.NO_CONTENT)
  @DeleteAllDataSwagger()
  async deleteAll() {
    // TRUNCATE TABLE - removes all data but keeps the table structure
    // RESTART IDENTITY - resets auto-incremented IDs (SERIAL primary keys)
    // CASCADE - removes dependent records in related tables to avoid foreign key constraints
    await this.dataSource.query(`
      TRUNCATE TABLE
      public.users_password_recovery,
      public.users_email_confirmation,
      public.player_progress,
      public.pair_games,
      public.answers,
      public.users,
      public.sessions,
      public.blogs,
      public.posts,
      public.comments,
      public.post_likes,
      public.comment_likes,
      public.questions
      RESTART IDENTITY CASCADE;
    `);
  }

  @Delete('game-data')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteGameData() {
    // Only clear game-related tables
    await this.dataSource.query(`
      TRUNCATE TABLE
      public.player_progress,
      public.pair_games,
      public.answers
      RESTART IDENTITY CASCADE;
    `);
  }
}
