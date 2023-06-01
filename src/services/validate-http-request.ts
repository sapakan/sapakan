import crypto from "crypto";
import * as http from "http";
import assert from "assert";

type ValidateSignatureOptions = {
  publicKey: string | null;
  requireDigest?: boolean;
};

/**
 * 与えられた HTTP リクエストに付与されている署名と Digest が正しいならば true を、そうでなければ false を返します。
 * ただし、署名または Digest が付与されていない場合は false を返します。
 */
export async function validateHttpRequest(
  req: http.IncomingMessage,
  reqBody: Buffer | null,
  options: ValidateSignatureOptions = {
    publicKey: null,
    requireDigest: true,
  }
): Promise<boolean> {
  if (options.requireDigest) {
    if (reqBody === null) {
      return false;
    }

    const digest = req.headers.digest;
    if (digest === undefined || typeof digest === "object") {
      return false;
    }
    if (!validateDigest(digest, reqBody)) {
      return false;
    }
  }

  return await validateSignature(req, options.publicKey);
}

/**
 * 与えられた Digest が正しいならば true を、そうでなければ false を返します。
 */
export function validateDigest(
  digestHeaderValue: string,
  reqBody: Buffer
): boolean {
  // SHA-256 で始まる署名のみをサポートする
  if (!digestHeaderValue.startsWith("SHA-256=")) {
    return false;
  }

  const expected = digestHeaderValue.slice(8);

  const hash = crypto.createHash("sha256");
  hash.update(reqBody);
  const actual = hash.digest("base64");

  return expected === actual;
}

/**
 * 与えられた HTTP リクエストに付与されている署名が正しいならば true を、そうでなければ false を返します。
 * algorithm は rsa-sha256 のみをサポートします。
 */
async function validateSignature(
  req: http.IncomingMessage,
  publicKey: string | null
): Promise<boolean> {
  const signatureHeaderValue = req.headers.signature;
  if (
    signatureHeaderValue === undefined ||
    typeof signatureHeaderValue === "object"
  ) {
    return false;
  }

  const signatureMap = translateToSignatureFields(signatureHeaderValue);
  const keyId = signatureMap.get("keyId");
  if (keyId === undefined) {
    return false;
  }

  const algorithm = signatureMap.get("algorithm");
  if (algorithm === undefined) {
    return false;
  }
  if (algorithm !== "rsa-sha256") {
    return false;
  }

  const signature = signatureMap.get("signature");
  if (signature === undefined) {
    return false;
  }

  const headers = signatureMap.get("headers");
  if (headers === undefined) {
    return false;
  }

  const signedHeaders = headers.split(" ");
  const signedString = buildSignedString(req, signedHeaders);
  console.log(signedString);

  if (publicKey === null) {
    const fetchedPublicKey = await fetchPublicKey(keyId);
    if (fetchedPublicKey === null) {
      return false;
    }
    publicKey = fetchedPublicKey;
  }

  const verifier = crypto.createVerify("sha256");
  verifier.update(signedString);
  return verifier.verify(publicKey, signature, "base64");
}

/**
 * Signature ヘッダーに格納されているキーバリューのマップを返します。
 */
function translateToSignatureFields(
  signatureHeaderValue: string
): Map<string, string> {
  return (
    signatureHeaderValue
      .split(",")
      .map((pair) => pair.split("="))
      // 2つ以上の "=" が含まれる可能性があるので、先頭の要素をキー、残りを値として扱う
      .map((array) => [array[0], array.slice(1).join("=")])
      .reduce((map, [key, value]) => map.set(key, JSON.parse(value)), new Map())
  );
}

/**
 * 与えられた HTTP リクエストに付与されている署名の対象となることが期待される文字列を返します。
 */
function buildSignedString(
  req: http.IncomingMessage,
  signedHeaders: string[]
): string {
  return signedHeaders
    .map((signedHeaderKey) => {
      const headerValue = getHeaderValueWithSignedHeaderKey(
        req,
        signedHeaderKey
      );
      return `${signedHeaderKey}: ${headerValue}`;
    })
    .join("\n");
}

/**
 * Signature ヘッダーに指定されている headers に対応するヘッダーの値を返します。
 */
function getHeaderValueWithSignedHeaderKey(
  req: http.IncomingMessage,
  signedHeaderKey: string
): string {
  if (signedHeaderKey === "(request-target)") {
    assert(req.method !== undefined);
    return `${req.method.toLowerCase()} ${req.url}`;
  }
  return req.headers[signedHeaderKey] as string;
}

/**
 * 与えられた keyId に対応する公開鍵を取得して返します。
 * 取得できなかった場合は null を返します。
 */
async function fetchPublicKey(keyId: string): Promise<string | null> {
  const response = await fetch(keyId, {
    method: "GET",
    headers: {
      Accept: "application/activity+json",
    },
  });
  if (!response.ok) {
    return null;
  }

  // TODO: ローカルアカウントが鍵ペアを持つようになったら `Person` の型定義を変更した上で `json` に型を付ける
  const person = await response.json();
  return person.publicKey.publicKeyPem;
}
