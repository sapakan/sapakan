import argon2 from "argon2";

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
