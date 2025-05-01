import { ApiProperty } from '@nestjs/swagger';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated-view.dto';
import { PairViewDto } from '../view-dto/game-pair.view-dto';

export class PaginatedPairGamesViewDto extends PaginatedViewDto<PairViewDto[]> {
  @ApiProperty({ type: [PairViewDto] })
  items: PairViewDto[];

  @ApiProperty()
  totalCount: number;

  @ApiProperty()
  pagesCount: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;
}
