import { Response, Request } from "express";
import prisma from "../lib/prisma";
import assert from "assert";

/**
 * GET /timeline
 */
export const getTimeline = async (req: Request, res: Response) => {
  const meId = req.user?.accountId;
  // 前段に ensureLoggedIn があるためここの meId が undefined になることはない
  assert(meId !== undefined);

  // me がフォローしているアカウントの post を、最新が初めに来るように取得する
  const posts = await prisma.post.findMany({
    where: {
      // followeeId == authorId である Post レコードを取得する
      author: {
        // followerId == meId である Following レコードの followeeId を取得する
        followees: {
          some: {
            followerId: {
              equals: meId,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // 1 クエリだけでは実現できなかったので、likedByMe フィールド用に別途クエリを実行する
  const likes = await prisma.like.findMany({
    where: {
      postId: {
        in: posts.map((post) => post.id),
      },
      likedById: {
        equals: meId,
      },
    },
  });

  // likedByMe フィールドを追加
  const resBody = posts.map((post) => {
    return {
      ...post,
      likedByMe: likes.find((like) => like.postId === post.id) !== undefined,
    };
  });

  res.status(200).json(resBody);
};
