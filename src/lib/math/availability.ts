export function isMathPracticeEnabled() {
  return (
    process.env.NODE_ENV !== 'production' ||
    process.env.NEXT_PUBLIC_ENABLE_MATH_PRACTICE === 'true'
  );
}
