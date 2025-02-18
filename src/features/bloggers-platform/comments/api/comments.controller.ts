import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PATHS } from '../../../../constants';
import { BasicAuthGuard } from 'src/features/user-accounts/guards/basic/basic-auth.guard';
import { CommandBus } from '@nestjs/cqrs';
import { CommentsViewDto } from './view-dto/comment.view-dto';
import { CommentsQueryRepository } from '../infrastructure/query/comments.query-repository';

@Controller(PATHS.COMMENTS)
export class CommentsController {
  constructor(
    private readonly commentsQueryRepository: CommentsQueryRepository,
  ) {}

  @Get(':id')
  async getCommentById(@Param('id') id: string): Promise<CommentsViewDto> {
    return await this.commentsQueryRepository.findCommentById(id);
  }

  //   @Put(':id')
  //   @UseGuards(BasicAuthGuard)
  //   @HttpCode(HttpStatus.NO_CONTENT)
  //   async updatePostById(
  //     @Param('id') id: string,
  //     @Body() updatePostDto: UpdatePostInputDto,
  //   ): Promise<void> {
  //     return await this.commandBus.execute(
  //       new UpdatePostCommand(id, updatePostDto),
  //     );
  //   }

  //   @Delete(':id')
  //   @UseGuards(BasicAuthGuard)
  //   @HttpCode(HttpStatus.NO_CONTENT)
  //   async deletePostById(@Param('id') id: string): Promise<void> {
  //     return await this.commandBus.execute(new DeletePostCommand(id));
  //   }
}
