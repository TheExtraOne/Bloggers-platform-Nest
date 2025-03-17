import { validateSync } from 'class-validator';

export const configValidationUtility = {
  validateConfig: (config: any) => {
    const errors = validateSync(config);
    if (errors.length > 0) {
      const sortedMessages = errors
        .map((error) => Object.values(error.constraints || {}).join(', '))
        .join('; ');
      throw new Error('Validation failed: ' + sortedMessages);
    }
  },

  convertStringToBoolean(value: string) {
    const trimmedValue = value?.trim();

    if (['true', '1', 'enabled'].includes(trimmedValue)) return true;
    if (['false', '0', 'disabled'].includes(trimmedValue)) return false;

    return null;
  },

  //   getEnumValues<T extends Record<string, string>>(enumObj: T): string[] {
  //     return Object.values(enumObj);
  //   },
};
