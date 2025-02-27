import { Injectable } from '@nestjs/common';

@Injectable()
export class TimeService {
  /**
   * Converts Unix timestamp to ISO string format
   * @param unixTime - Unix timestamp in seconds
   * @returns ISO string format date
   */
  convertUnixToISOString(unixTime: number): string {
    return new Date(unixTime * 1000).toISOString();
  }

  /**
   * Converts Unix timestamp to Date object
   * @param unixTime - Unix timestamp in seconds
   * @returns Date object
   */
  convertUnixToDate(unixTime: number): Date {
    return new Date(unixTime * 1000);
  }

  /**
   * Gets current time in ISO string format
   * @returns Current time in ISO string
   */
  getCurrentISOString(): string {
    return new Date().toISOString();
  }

  /**
   * Adds seconds to a given date and returns ISO string
   * @param date - Base date
   * @param seconds - Seconds to add
   * @returns Resulting date in ISO string format
   */
  addSecondsToDate(date: Date, seconds: number): string {
    const newDate = new Date(date);
    newDate.setSeconds(date.getSeconds() + seconds);
    return newDate.toISOString();
  }
}
