import { ApiProperty } from '@nestjs/swagger';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated-view.dto';
import { PGQuestionViewDto } from '../view-dto/question.view-dto';

export class PaginatedQuestionsViewModel implements PaginatedViewDto<PGQuestionViewDto[]> {
  @ApiProperty({ type: [PGQuestionViewDto] })
  items: PGQuestionViewDto[];

  @ApiProperty({ type: Number })
  totalCount: number;

  @ApiProperty({ type: Number })
  pagesCount: number;

  @ApiProperty({ type: Number })
  page: number;

  @ApiProperty({ type: Number })
  pageSize: number;
}
