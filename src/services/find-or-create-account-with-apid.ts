import { Account } from "@prisma/client";
import prisma from "../lib/prisma";
import { createExternalAccount } from "./create-account";

/**
 * 与えられた apid に対応するアカウントが存在すればそれを返し、
 * 存在しなければ作成してから返します。
 */
export async function findOrCreateAccountWithApid(
  apid: string
): Promise<Account> {
  const account = await prisma.account.findUnique({
    where: {
      apid: apid,
    },
  });
  if (account === null) {
    const actorRes = await fetch(apid, {
      headers: {
        accept: "application/activity+json",
      },
    });
    const actor = await actorRes.json();
    return await createExternalAccount(
      actor.name,
      new URL(actor.id).hostname,
      actor.id,
      actor.inbox,
      actor.publicKey.publicKeyPem
    );
  }
  return account;
}
