import isEqual from 'lodash/isEqual';

// Define the return type for the function
interface Diff<T> {
  oldValue: Partial<T> | null;
  newValue: Partial<T> | null;
}

// Define the function with generics for strong typing
const getDiffBetweenTwoObjects = <T extends Record<string, any>>(
  a: T,
  b: T
): Diff<T> => {
  return Object.keys(a).reduce<Diff<T>>(
    (acc, curKey) => {
      const key = curKey as keyof T;

      if (!isEqual(a[key], b[key])) {
        acc.oldValue = {
          ...acc.oldValue,
          [key]: b[key],
        } as Partial<T>; // Explicitly cast to Partial<T>
        acc.newValue = {
          ...acc.newValue,
          [key]: a[key],
        } as Partial<T>; // Explicitly cast to Partial<T>
      }

      return acc;
    },
    { oldValue: {}, newValue: {} } // Initialize with empty partial objects
  );
};

export default getDiffBetweenTwoObjects;
