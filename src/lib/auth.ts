import argon2 from "argon2";
import { generateKeyPairSync } from "crypto";

const OPTIONS: argon2.Options & { raw?: false } = {
  type: argon2.argon2id,
  memoryCost: 19 * 1024,
  timeCost: 2,
  parallelism: 1,
};

/**
 * https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#argon2id
 */
export function generateHash(password: string) {
  return argon2.hash(password, OPTIONS);
}

/**
 * https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#argon2id
 */
export function verifyPassword(hash: string, password: string) {
  return argon2.verify(hash, password, OPTIONS);
}

/**
 * 長さ 2048 の RSA 鍵ペアを生成します。
 * [publicKey, privateKey] を返します。
 *
 * 長さは多数派の 2048 にしている。
 * Pleroma は 2048: https://git.pleroma.social/pleroma/pleroma/-/blob/31ec5cd35eece97aa1213c401b40d3ab83689ea9/lib/pleroma/keys.ex#L11
 * Mastodon は 2048: https://github.com/mastodon/mastodon/blob/55785b160320783392ffe3f24c5ca48e6ee7a5f2/app/models/account.rb#L465-L471
 * Misskey は 4096: https://github.com/misskey-dev/misskey/blob/6dd219b6c7d13d6852a5e4173fb8cd7430bd41ff/packages/backend/src/core/SignupService.ts#L93-L108
 */
export async function createKeyPair(): Promise<[string, string]> {
  // 長さ 2048 の RSA 鍵を生成する
  const { publicKey, privateKey } = await generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });
  return [
    publicKey.export({ type: "pkcs1", format: "pem" }).toString(),
    privateKey.export({ type: "pkcs1", format: "pem" }).toString(),
  ];
}
