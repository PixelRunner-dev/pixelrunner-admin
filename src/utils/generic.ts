import type { UUID } from 'pixelrunner-shared/lib/types';

export function isValidUUID(uuid: UUID): boolean {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
}

export function generateRandomUUID(): UUID {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ([1e7] as any).toString(16).replace(/1|0/g, () => ((Math.random() * 16) | 0).toString(16));
}

export function toKebabCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

export function toCamelCase(str: string): string {
  return str.replace(/([-_][a-z])/g, (group) =>
    group.toUpperCase().replace('-', '').replace('_', '')
  );
}

export function toPascalCase(str: string): string {
  return toCamelCase(toCapitalizeWords(str));
}

export function toCapitalizeWords(input: string): string {
  return input
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function vibrateDevice(vibrateLength = 10): void {
  if ('vibrate' in navigator) navigator.vibrate(vibrateLength);
}
