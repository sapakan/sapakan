import { Account } from "@prisma/client";
import prisma from "./prisma";
import { promises } from "dns";

/**
 * account をフォローしているリモートのアカウントを取得します。
 */
export async function listRemoteFollowerAccounts(
  accountId: number
): Promise<Account[]> {
  const remoteFollowings = await prisma.following.findMany({
    where: {
      followeeId: accountId,
      follower: {
        host: {
          // ローカルに存在するアカウントの host は localhost であるから
          not: "localhost",
        },
      },
    },
    select: {
      follower: true,
    },
  });
  // うまく follower だけを直接取り出せなかったので .map で対応
  return remoteFollowings.map((f) => f.follower);
}
