import { ApiProperty } from '@nestjs/swagger';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated-view.dto';
import { TopUserViewDto } from '../view-dto/top-user.view-dto';

export class TopUsersPaginatedSwagger extends PaginatedViewDto<TopUserViewDto[]> {
  @ApiProperty({ type: [TopUserViewDto] })
  items: TopUserViewDto[];

  @ApiProperty({ type: Number })
  totalCount: number;

  @ApiProperty({ type: Number })
  pagesCount: number;

  @ApiProperty({ type: Number })
  page: number;

  @ApiProperty({ type: Number })
  pageSize: number;
}
