import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PATHS } from '../../src/constants';

export const deleteAllData = async (app: INestApplication) => {
  await request(app.getHttpServer())
    .delete(`/${PATHS.TESTING}/all-data`)
    .expect(HttpStatus.NO_CONTENT);
};
