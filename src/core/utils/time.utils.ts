/**
 * Converts Unix timestamp to Date object
 * @param unixTime - Unix timestamp in seconds
 * @returns Date object
 */
export const convertUnixToDate = (unixTime: number): Date => {
  return new Date(unixTime * 1000);
};
