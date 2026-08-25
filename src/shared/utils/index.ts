export const chunk = <T>(arr: ArrayLike<T>, size: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    const part: T[] = [];
    for (let j = 0; j < size && i + j < arr.length; j++) {
      part.push(arr[i + j]);
    }
    result.push(part);
  }
  return result;
};

export const base4toInt = (a: number, b: number, c: number) => {
  return a * 16 + b * 4 + c;
};
