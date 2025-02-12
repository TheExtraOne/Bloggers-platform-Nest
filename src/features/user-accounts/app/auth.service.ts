import { Injectable } from '@nestjs/common';
import { UserService } from './users.service';
import { CreateUserInputDto } from '../api/input-dto/users.input-dto';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async createUser(dto: CreateUserInputDto): Promise<string> {
    return await this.userService.createUser(dto);
  }
}
