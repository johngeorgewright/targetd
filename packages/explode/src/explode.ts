import type { Explode } from "./types.ts";

export function explode<
  T extends Record<string, unknown>,
  PathSeparator extends string,
>(x: T, pathSeparator: string): Explode<T, PathSeparator> {
  return Object.entries(x).reduce(
    (acc, [key, value]) =>
      set(acc as object, key.split(pathSeparator), value) as Explode<
        T,
        PathSeparator
      >,
    {} as Explode<T, PathSeparator>,
  );
}

function set(obj: object, path: string[], value: unknown) {
  path.reduce<any>(
    (acc, key, i) => {
      if (acc[key] === undefined) acc[key] = {};
      if (i === path.length - 1) acc[key] = value;
      return acc[key];
    },
    obj as Record<string, unknown>,
  );
  return obj;
}
