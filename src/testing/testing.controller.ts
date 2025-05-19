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
    // Use transaction for faster cleanup
    await this.dataSource.transaction(async (manager) => {
      // Disable foreign key checks, truncate all tables, then re-enable checks
      await manager.query('SET CONSTRAINTS ALL DEFERRED');
      await manager.query(`
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
      await manager.query('SET CONSTRAINTS ALL IMMEDIATE');
    });
  }

  @Delete('game-data')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteGameData() {
    // Use transaction for faster cleanup
    await this.dataSource.transaction(async (manager) => {
      await manager.query('SET CONSTRAINTS ALL DEFERRED');
      await manager.query(`
        TRUNCATE TABLE
        public.player_progress,
        public.pair_games,
        public.answers
        RESTART IDENTITY CASCADE;
      `);
      await manager.query('SET CONSTRAINTS ALL IMMEDIATE');
    });
  }
}
