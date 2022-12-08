import { Response, Request } from "express";
import prisma from "../lib/prisma";

/**
 * GET /accounts/:id
 */
export const getAccount = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const account = await prisma.account.findUnique({ where: { id } });
  if (account === null) {
    return res.status(404).json({ message: "Account not found" });
  }
  res.status(200).json(account);
};

/**
 * POST /accounts
 */
export const postAccounts = async (req: Request, res: Response) => {
  // このへんの validation は既存パッケージを使ってもう少しキレイにやりたい
  const username: string | undefined = req.body.username;

  if (username === undefined) {
    return res.status(400).json({ message: "username required" });
  }
  if (!username.match(/^[a-zA-Z][0-9a-zA-Z]*$/)) {
    return res.status(400).json({
      message:
        "username must begin with [a-zA-Z], and can only use [a-zA-Z0-9].",
    });
  }

  if (await accountWithUsernameExists(username)) {
    // 409 Conflict を返すのが適切かもしれないが、とりあえず 400 を返しておくこととする
    // https://stackoverflow.com/questions/3825990/http-response-code-for-post-when-resource-already-exists
    return res.status(400).json({
      message: `The username "${username}" is already taken by another user.`,
    });
  }

  const createdAccount = await prisma.account.create({
    data: {
      username,
    },
  });

  res.status(200).json(createdAccount);
};

/**
 * GET /accounts/:id/likes
 */
export const getAccountLikes = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const account = await prisma.account.findUnique({ where: { id } });
  if (account === null) {
    return res.status(404).json({ message: "Account not found" });
  }

  const likes = await prisma.like.findMany({
    where: {
      id,
    },
    include: {
      likedBy: true,
      post: true,
    },
  });

  res.status(200).json(likes);
};

/**
 * GET /accounts/:id/posts
 */
export const getAccountPosts = async (req: Request, res: Response) => {
  if (req.params.id === undefined) {
    return res.status(400).json({ message: "id is required" });
  }
  const id = parseInt(req.params.id);
  const account = await prisma.account.findUnique({ where: { id } });
  if (account === null) {
    return res.status(404).json({ message: "Account not found" });
  }

  const includeReplies = req.query.includeReplies === "true";

  const posts = await prisma.post.findMany({
    where: { authorId: id, replyToId: includeReplies ? {} : null },
    include: {
      author: true,
    },
  });
  res.status(200).json(posts);
};

/**
 * 与えられた Username を持つアカウントが存在するならば true を、そうでなければ false を返します。
 */
function accountWithUsernameExists(username: string): Promise<boolean> {
  return prisma.account
    .count({ where: { username } })
    .then((count) => count > 0);
}
