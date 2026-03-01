import type { Rgba } from "types";

export function shuffle(arr: unknown[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
}

export const choice = <A>(list: readonly A[]) => {
  const index = Math.floor(Math.random() * list.length)
  return list[index]
};

export const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;

export const chunk = <T>(arr: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};


export const createRandom = (hash: string): () => number => {
  let state = 2166136261 >>> 0;

  for (let i = 0; i < hash.length; i++) {
    state ^= hash.charCodeAt(i);
    state = Math.imul(state, 16777619);
  }

  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const lerpRgb = (a: Rgba, b: Rgba, t: number) => {
  a[0] = lerp(a[0], b[0], t);
  a[1] = lerp(a[1], b[1], t);
  a[2] = lerp(a[2], b[2], t);
};

export const base4toInt = (a: number, b: number, c: number) => {
  return a * 16 + b * 4 + c;
};

export const clampCycle = (value: number, max: number): number => {
  return ((value % max) + max) % max;
}

export const roundToEven = (n: number) => {
  return Math.round(n / 2) * 2;
}

export const hslaToRgba = (h: number, s: number, l: number, a: number): Rgba => {
  h /= 360;
  s /= 100;
  l /= 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [
    Math.round(r * 255),
    Math.round(g * 255),
    Math.round(b * 255),
    Math.round(a * 255)
  ];
}