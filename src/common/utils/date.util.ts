export function formatISODate(date: Date = new Date()): string {
  return date.toISOString();
}

export function formatDateForUnionBank(date: Date = new Date()): string {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

export function parseUnionBankDate(dateString: string): Date {
  return new Date(dateString);
}

export function isWithinBusinessHours(date: Date = new Date()): boolean {
  const hour = date.getHours();
  const day = date.getDay();

  // Monday to Friday, 8 AM to 5 PM Philippine Time
  const isWeekday = day >= 1 && day <= 5;
  const isBusinessHour = hour >= 8 && hour < 17;

  return isWeekday && isBusinessHour;
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function getExpiryTimestamp(ttlSeconds: number): Date {
  return new Date(Date.now() + ttlSeconds * 1000);
}
