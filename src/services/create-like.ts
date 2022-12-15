import { Like } from "@prisma/client";
import prisma from "../lib/prisma";

/**
 * 与えられた postId と likedById に紐づく Like を作成します。
 */
export async function createLike(
  postId: number,
  likedById: number
): Promise<Like> {
  const [like] = await prisma.$transaction([
    prisma.like.create({
      data: {
        postId,
        likedById,
      },
    }),
    prisma.post.update({
      where: {
        id: postId,
      },
      data: {
        likeCount: {
          increment: 1,
        },
      },
    }),
  ]);

  return like;
}

/**
 * 与えられた postId と likedById に紐づく Like を削除します。
 */
export async function deleteLike(
  postId: number,
  likedById: number
): Promise<Like> {
  const [like] = await prisma.$transaction([
    prisma.like.delete({
      where: {
        postId_likedById: {
          postId,
          likedById,
        },
      },
    }),
    prisma.post.update({
      where: {
        id: postId,
      },
      data: {
        likeCount: {
          decrement: 1,
        },
      },
    }),
  ]);

  return like;
}
