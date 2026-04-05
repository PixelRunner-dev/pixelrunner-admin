export class CookieStore {
  static set(name: string, value: string, days: number = 365, path: string = '/'): void {
    const expires = days === 0 ? '' : `; expires=${new Date(Date.now() + days * 864e5).toUTCString()}`;
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}${expires}; path=${path}`;
  }

  static get(name: string): string | null {
    const encoded = encodeURIComponent(name) + '=';
    const match = document.cookie.split('; ').find(row => row.startsWith(encoded));
    return match ? decodeURIComponent(match.substring(encoded.length)) : null;
  }

  static delete(name: string, path: string = '/'): void {
    document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
  }

  static all(): Record<string, string> {
    if (!document.cookie) return {};
    return document.cookie.split('; ').reduce<Record<string, string>>((acc, pair) => {
      const idx = pair.indexOf('=');
      if (idx === -1) return acc;
      const n = decodeURIComponent(pair.slice(0, idx));
      const v = decodeURIComponent(pair.slice(idx + 1));
      acc[n] = v;
      return acc;
    }, {});
  }

  static has(name: string): boolean {
    return this.get(name) !== null;
  }
}
