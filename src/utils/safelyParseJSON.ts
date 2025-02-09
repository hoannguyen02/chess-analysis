export function safelyParseJSON(jsonString: string) {
  try {
    return JSON.parse(jsonString);
  } catch {
    return null; // or provide a default value
  }
}
