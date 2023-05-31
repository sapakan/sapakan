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
