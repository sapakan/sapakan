import { Post, Prisma } from "@prisma/client";
import prisma from "../lib/prisma";

/**
 * 与えられた投稿候補に基いて投稿を作成します。返信先が存在する場合は、返信先の投稿の返信数を increment します。
 * @returns データベースに作成された投稿
 */
export async function createPost(
  candidatePost: Prisma.PostCreateArgs["data"]
): Promise<Post> {
  if (
    candidatePost.replyToId !== undefined &&
    candidatePost.replyToId !== null
  ) {
    // 返信を作成するときは返信先の投稿の repliesCount を increment する
    const [post] = await prisma.$transaction([
      prisma.post.create({
        data: candidatePost,
      }),
      prisma.post.update({
        where: { id: candidatePost.replyToId },
        data: { repliesCount: { increment: 1 } },
      }),
    ]);

    return post;
  } else {
    return prisma.post.create({ data: candidatePost });
  }
}
