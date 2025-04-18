export class PGQuestionViewDto {
  id: string;
  body: string;
  correctAnswers: string[];
  published: boolean;
  createdAt: Date;
  updatedAt: Date;

  // TODO: clean
  // static mapToView(user: Users): PGUserViewDto {
  //   const dto = new PGUserViewDto();

  //   dto.id = user.id.toString();
  //   dto.login = user.login;
  //   dto.email = user.email;
  //   dto.createdAt = user.createdAt;

  //   return dto;
  // }
}
