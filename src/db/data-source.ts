import { DataSource } from 'typeorm';

export default new DataSource({
  url: 'some-uri',
  type: 'postgres',
  synchronize: false,
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
  entities: ['src/**/*.entity{.ts,.js}'],
});
