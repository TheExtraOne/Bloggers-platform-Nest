import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const responseBody: any = exception.getResponse();

    if (status === 400) {
      const errors = {
        errorsMessages: responseBody.message,
      };
      response.status(status).json(errors);
    } else if (status === 401) {
      response.sendStatus(401);
    } else if (status === 403) {
      response.sendStatus(403);
    } else if (status === 404) {
      response.sendStatus(404);
    } else if (status === 429) {
      response.sendStatus(429);
    } else {
      response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }
  }
}
