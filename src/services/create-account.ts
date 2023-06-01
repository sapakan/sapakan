import { Account } from "@prisma/client";
import prisma from "../lib/prisma";
import { createKeyPair } from "../lib/auth";
import { config } from "../config";

/**
 * 与えられた username と userId に紐付くローカルアカウントを作成します。
 */
export async function createLocalAccount(
  username: string,
  userId: number
): Promise<Account> {
  const [publicKey, privateKey] = createKeyPair();
  return prisma.account.create({
    data: {
      username,
      host: "localhost",
      apid: `${config.url}/accounts/${username}`,
      inboxUrl: `${config.url}/accounts/${username}/inbox`,
      publicKey,
      privateKey,
      userId: userId,
    },
  });
}
/**
 * 与えられた apid に紐付くリモートインスタンス上のアカウントを作成します。
 */
export async function createExternalAccount(
  username: string,
  host: string,
  apid: string,
  inboxUrl: string,
  publicKey: string
): Promise<Account> {
  return prisma.account.create({
    data: {
      username: username,
      host: host,
      apid: apid,
      inboxUrl: inboxUrl,
      publicKey: publicKey,
    },
  });
}
