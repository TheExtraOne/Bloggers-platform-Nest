import { ApiProperty } from '@nestjs/swagger';

export class UserStatisticViewDto {
  /**
  Sum scores of all games
   */
  @ApiProperty({
    description: 'Sum scores of all games',
  })
  sumScore: number;
  /**
  Average score of all games rounded to 2 decimal places
   */
  @ApiProperty({
    description: 'Average score of all games rounded to 2 decimal places',
  })
  avgScores: number;
  /**
  Number of games
   */
  @ApiProperty({
    description: 'Number of games',
  })
  gamesCount: number;
  /**
  Number of wins
   */
  @ApiProperty({
    description: 'Number of wins',
  })
  winsCount: number;
  /**
  Number of losses
   */
  @ApiProperty({
    description: 'Number of losses',
  })
  lossesCount: number;
  /**
  Number of draws
   */
  @ApiProperty({
    description: 'Number of draws',
  })
  drawsCount: number;
}
