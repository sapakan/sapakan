import { Blocking } from "@prisma/client";
import prisma from "../lib/prisma";
import { deleteFollowing } from "./create-following";

/**
 * 与えられた blockeeId と blockerId に紐付く blocking を作成します。
 */
export async function createBlocking(
  blockeeId: number,
  blockerId: number
): Promise<Blocking> {
  return await prisma.$transaction(async (prisma) => {
    const blocking = await prisma.blocking.create({
      data: {
        blockeeId: blockeeId,
        blockerId: blockerId,
      },
    });

    // blockerId と blockeeId の両方向のフォロー関係を解除する
    const followingBlockerToBlockee = await prisma.following.findUnique({
      where: {
        followeeId_followerId: {
          followeeId: blockeeId,
          followerId: blockerId,
        },
      },
    });
    if (followingBlockerToBlockee) {
      await deleteFollowing(blockeeId, blockerId);
    }

    const followingBlockeeToBlocker = await prisma.following.findUnique({
      where: {
        followeeId_followerId: {
          followeeId: blockerId,
          followerId: blockeeId,
        },
      },
    });
    if (followingBlockeeToBlocker) {
      await deleteFollowing(blockerId, blockeeId);
    }

    return blocking;
  });
}

/**
 * 与えられた blockeeId と blockerId に紐付く blocking を削除します。
 */
export async function deleteBlocking(
  blockeeId: number,
  blockerId: number
): Promise<Blocking> {
  return await prisma.blocking.delete({
    where: {
      blockeeId_blockerId: {
        blockeeId: blockeeId,
        blockerId: blockerId,
      },
    },
  });
}
