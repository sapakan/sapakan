import { randomUUID } from "crypto";

/**
 * ハイフンなしのランダムな UUID を生成します。
 */
export function randomUuidWithoutHyphen(): string {
  return randomUUID().replaceAll("-", "");
}
