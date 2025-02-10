export {};

declare global {
  interface Window {
    dataLayer?: { push: (event: any) => void };
  }
}
