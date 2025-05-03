import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsSortFieldAndDirection(
  allowedFields: string[],
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isSortFieldAndDirection',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, _args: ValidationArguments) {
          if (typeof value === 'string') value = [value];
          if (!Array.isArray(value)) return false;

          return value.every((item: unknown) => {
            if (typeof item !== 'string') return false;
            const [field, direction] = item.split(' ');

            if (!field || !direction) return false;
            if (!allowedFields.includes(field.toLowerCase())) return false;
            if (!['asc', 'desc'].includes(direction.toLowerCase()))
              return false;
            return true;
          });
        },
        defaultMessage(_args: ValidationArguments) {
          return `Each sort param should be in format "fieldName direction", where fieldName ∈ [${allowedFields.join(', ')}], and direction is 'asc' or 'desc'`;
        },
      },
    });
  };
}
