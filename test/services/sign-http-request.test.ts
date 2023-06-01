import { validateHttpRequest } from "../../src/services/validate-http-request";
import httpMocks from "node-mocks-http";
import { signHttpRequestWithAccount } from "../../src/services/sign-http-request";

/// テストに用いる鍵ペアのうちの公開鍵
const PUBLIC_KEY = `-----BEGIN RSA PUBLIC KEY-----
MIIBCgKCAQEA0ntBx77mApx2wReKi+xzx4SK2woDZK8MsWpVEtgj13x9cs1PnDrA
GHG5KQA8rC8iWvHP+RiNddy65HO2zrgA2voXSeFTK/IMqOTzMh/NJ+dTN46sZRHu
yWLZPc0I8fiLSaJ4gDhpNpDx/vvVt8OKIhWSlXEY1C7R8t/Fryw38PmxaUOg2dAT
hRRBqsenEm4X/RIlxfFliQB8XS0gwgveZRvCjzHwy/wSrPyYkjMScxcF64TnWCGw
SvO1XA3SwVZxtlVBtF0U2kvxVx3L6F5tKs/m9TfnN9WFxdXHuliv9mlVxfzTA6cV
8kCASfFwWeG25ug47sf0w+rBhCVk2gz3/QIDAQAB
-----END RSA PUBLIC KEY-----`;

/// テストに用いる鍵ペアのうちの秘密鍵
const PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA0ntBx77mApx2wReKi+xzx4SK2woDZK8MsWpVEtgj13x9cs1P
nDrAGHG5KQA8rC8iWvHP+RiNddy65HO2zrgA2voXSeFTK/IMqOTzMh/NJ+dTN46s
ZRHuyWLZPc0I8fiLSaJ4gDhpNpDx/vvVt8OKIhWSlXEY1C7R8t/Fryw38PmxaUOg
2dAThRRBqsenEm4X/RIlxfFliQB8XS0gwgveZRvCjzHwy/wSrPyYkjMScxcF64Tn
WCGwSvO1XA3SwVZxtlVBtF0U2kvxVx3L6F5tKs/m9TfnN9WFxdXHuliv9mlVxfzT
A6cV8kCASfFwWeG25ug47sf0w+rBhCVk2gz3/QIDAQABAoIBAB8GrT0g7i3PW4/+
BN24Vp6/8mn0UWi7hv72AiFbe/kNMD7Gdeg9HsjbpqQdFVR6RDGsuG/rBxsrFN+N
ERLqu7GLsPgif0yYivYwfYrTdj3eEv27Cb2CRbUo3YYHHbzxWrLZgLLB3fx9pDZm
b+v9JnT8whVGTRcl6avIAY9fUMWz/CxTt8wrx5VIQO5y111taIWbiK24WLQ+Mltg
1Em+VYKeGRVLHZhvvzRRl+lAtaXxko1Q6CC+Qcu3/w4tpREmJ28LuBB7Yk/03Eyo
PF4kVeYxjDGe7Mme+/XKZGhmZfvdGQqA6mS+qJRSlI2y/oryIxQfJX5SBsw087Lv
GZPOYSECgYEA15yL4fOnsdTPRVirCEB7zppJojIEs9AY8TcuBopUlyNFsUk7upuQ
SRpZDxrHWz9NzzRzgvkLSm/ogyWQuOUa2Fvj0d6sdJMsenOui3HoKhlTgbOJTJTJ
XFox2ut1IpRUy9aTh1NZ70fNkarZpm57AiBq298IbhY0+kXAPu5Ctg0CgYEA+ei0
TCUsAVxSp17nZpgM+SGXtQ8pHY9vZDSG0OeGU6Wk8e1UECyLA3WnTp1kPs9tCOZv
6vj1+XkAIBG3EAID9fbd2BQ+Z5zOE8CxTTL2QRfjEkt/PQMq9yt5redJdbZEeq6U
vp0MSNZvJVzDU/HSlexCTlQd42UKl8ySNeO8PbECgYBFPVqWhx6VNxgQ1valwb+A
i3+V/KYR8IPyApxfMVEU8BjTZAcwWACv2Sw8c4cNwHiGT/vAVaXQk7uBUjD1j21d
ibTRksai8RhZgojM8xlxW4y7nCI9W5KGe9iCyxZksmnAw/nAfX3mH5LecpVOozAR
cMOgNDGK2MrOjFO+Ydk+iQKBgQCRaxZW5J5poEY8PB4cdce+xAxaABtlpwwjW+lC
8CYa0F1dpULwMmsltTWIqk8luV9x+V0QdpPy+bTX9Fb4iqOxYVgPnx/8/KJxngPN
ryTaFcM85w9/+jLrJrIkPlxhkZDhbmsBS7NVQunj7MmANEvcj2C54XqO0kHKuPAv
SXhE0QKBgQCgrEuQVLRf2ilyTkQCZB4+SrnBgkCOpubVqyvOhDbBN/WpeTV38YI/
+WFVX4rQmTdLmZj+BYzQaBxM+wvDNfC9FaAtERj43hWC3xtY5c0y5NvqK7sEICdt
43WZzl49I9v9YGIyw9Lg1UPFyYyCNL4r4NN/RVtAbqPGXm0eyA48vg==
-----END RSA PRIVATE KEY-----`;

describe(signHttpRequestWithAccount, () => {
  test("署名を作成できる", async () => {
    const date = new Date();

    const headersWithSignature = await signHttpRequestWithAccount(
      "username",
      "GET",
      "/foo/bar",
      date,
      {
        accept: "application/activity+json",
        date: date.toUTCString(),
      },
      PRIVATE_KEY
    );

    expect(headersWithSignature).toHaveProperty("Signature");
  });

  test("正しい署名を生成できる", async () => {
    const date = new Date();

    const headersWithSignature = await signHttpRequestWithAccount(
      "alice",
      "POST",
      "/foo/bar",
      date,
      {
        accept: "application/activity+json",
        date: date.toUTCString(),
      },
      PRIVATE_KEY
    );

    const req = httpMocks.createRequest({
      method: "POST",
      url: "/foo/bar",
      headers: headersWithSignature,
    });

    expect(
      await validateHttpRequest(req, null, {
        publicKey: PUBLIC_KEY,
        requireDigest: false,
      })
    ).toBe(true);
  });
});
