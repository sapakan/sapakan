import { createKeyPair } from "../../src/lib/auth";

describe(createKeyPair, () => {
  test("RSA 鍵ペアを生成できる", () => {
    const [publicKey, privateKey] = createKeyPair();

    console.log(publicKey);
    expect(publicKey).toMatch(/^-----BEGIN RSA PUBLIC KEY-----\n/m);
    expect(publicKey).toMatch(/\n-----END RSA PUBLIC KEY-----$/m);

    console.log(privateKey);
    expect(privateKey).toMatch(/^-----BEGIN RSA PRIVATE KEY-----\n/m);
    expect(privateKey).toMatch(/\n-----END RSA PRIVATE KEY-----$/m);
  });
});
