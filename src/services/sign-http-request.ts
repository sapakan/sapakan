import crypto from "crypto";
import { config } from "../config";
import prisma from "../lib/prisma";
import assert from "assert";

/**
 * 与えられた HTTP リクエストに署名を付与します。
 */
export async function signHttpRequestWithAccount(
  username: string,
  method: string,
  path: string,
  date: Date,
  headers: Record<string, string>,
  privateKey?: string
): Promise<Record<string, string>> {
  if (privateKey === undefined) {
    const account = await prisma.account.findUniqueOrThrow({
      where: {
        username_host: {
          username,
          host: "localhost",
        },
      },
    });
    // ローカルアカウントは privateKey を必ず持つ
    assert(account.privateKey !== null);
    privateKey = account.privateKey;
  }

  const keyId = `${config.url}/accounts/${username}#main-key`;
  const algorithm = "rsa-sha256";
  const headerKeys = ["(request-target)", "date"];

  const message = [
    `(request-target): ${method.toLowerCase()} ${path}`,
    `date: ${date.toUTCString()}`,
  ].join("\n");

  const signatureValue = [
    'keyId="' + keyId + '"',
    'algorithm="' + algorithm + '"',
    'headers="' + headerKeys.join(" ") + '"',
    'signature="' + signMessage(message, privateKey) + '"',
  ].join(",");

  return {
    ...headers,
    Signature: signatureValue,
  };
}

function signMessage(message: string, privateKey: string): string {
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(message);
  return signer.sign(privateKey, "base64");
}
