import type { ClockPort } from "@/infrastructure/ports/clock";

export class SystemClockAdapter implements ClockPort {
  now(): Date {
    return new Date();
  }
}
