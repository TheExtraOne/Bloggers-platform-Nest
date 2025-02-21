import { HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export const DeleteAllDataSwagger = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    ApiOperation({
      summary: 'Delete all data',
      description:
        'Removes all data from all collections in the database. Use only for testing purposes.',
    })(target, propertyKey, descriptor);
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: 'All data has been successfully deleted.',
    })(target, propertyKey, descriptor);
    return descriptor;
  };
};
