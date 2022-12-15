/**
 * 与えられたものを JSON.stringify した後に JSON.parse して返します。
 * API response のテスト時に、元のオブジェクトに含まれる Date オブジェクトなどを JSON 文字列に変換して比較するための利用を想定しています。
 */
export function toJSONObject(obj: unknown) {
  return JSON.parse(JSON.stringify(obj));
}
