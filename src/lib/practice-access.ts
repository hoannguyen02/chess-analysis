const key = 'lima-practice-access';
let currentToken = '';
export function readPracticeToken(): string {
  if (typeof window === 'undefined') return '';
  try {
    currentToken = localStorage.getItem(key) ?? '';
  } catch {
    /* Memory fallback when storage is blocked. */
  }
  return currentToken;
}
export function savePracticeToken(token: string) {
  currentToken = token;
  try {
    if (token) localStorage.setItem(key, token);
    else localStorage.removeItem(key);
  } catch {
    /* Access still works for this page when persistent storage is blocked. */
  }
}
export function practiceAccessHeaders(): Record<string, string> {
  const token = readPracticeToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
