export const filteredQuery = (queryObject: Record<string, any>) => {
  return Object.entries(queryObject)
    .filter(([, value]) => value) // Exclude undefined values
    .map(
      ([key, value]) => `${key}=${encodeURIComponent(value as string | number)}`
    ) // Encode values for safety
    .join('&');
};
