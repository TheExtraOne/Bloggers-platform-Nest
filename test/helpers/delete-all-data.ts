import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PATHS } from '../../src/constants';

export const deleteAllData = async (app: INestApplication) => {
  return await request(app.getHttpServer()).delete(
    `/${PATHS.TESTING}/all-data`,
  );
};
