declare module 'qrcode' {
  export function toDataURL(text: string): Promise<string>;
  export function toDataURL(text: string, options: any): Promise<string>;
  export function toDataURL(text: string, options: any, callback: (err: Error | null, url: string) => void): void;
}