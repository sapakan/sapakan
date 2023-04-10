/**
 * 与えられた値が整数を表現する文字列ならばその整数を、そうでなければ undefined を返します。
 */
export default function parseIntOrUndefined(
  value: unknown
): number | undefined {
  if (typeof value === "string") {
    const parsed = parseInt(value);
    if (Number.isNaN(parsed)) {
      return undefined;
    }
    return parsed;
  }
  return undefined;
}
