import { Following } from "@prisma/client";
import prisma from "../lib/prisma";

/**
 * 与えられた followeeId と followingId に紐付く following を作成します。
 */
export async function createFollowing(
  followeeId: number,
  followerId: number
): Promise<Following> {
  const [following] = await prisma.$transaction([
    prisma.following.create({
      data: {
        followeeId: followeeId,
        followerId: followerId,
      },
    }),
    prisma.account.update({
      where: {
        id: followeeId,
      },
      data: {
        followerCount: {
          increment: 1,
        },
      },
    }),
    prisma.account.update({
      where: {
        id: followerId,
      },
      data: {
        followeeCount: {
          increment: 1,
        },
      },
    }),
  ]);

  return following;
}

/**
 * 与えられた followeeId と followingId に紐付く following を削除します。
 */
export async function deleteFollowing(
  followeeId: number,
  followerId: number
): Promise<Following> {
  const [following] = await prisma.$transaction([
    prisma.following.delete({
      where: {
        followeeId_followerId: {
          followeeId: followeeId,
          followerId: followerId,
        },
      },
    }),
    prisma.account.update({
      where: {
        id: followeeId,
      },
      data: {
        followerCount: {
          decrement: 1,
        },
      },
    }),
    prisma.account.update({
      where: {
        id: followerId,
      },
      data: {
        followeeCount: {
          decrement: 1,
        },
      },
    }),
  ]);

  return following;
}
