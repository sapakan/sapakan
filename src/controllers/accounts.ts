import { Request, Response } from "express";
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
 * GET /accounts/:id/likes
 */
export const getAccountLikes = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "id is not an integer" });
  }
  const account = await prisma.account.findUnique({ where: { id } });
  if (account === null) {
    return res.status(404).json({ message: "Account not found" });
  }

  const likes = await prisma.like.findMany({
    where: {
      likedById: id,
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
  const includeReposts = req.query.includeReposts === "true";

  const posts = await prisma.post.findMany({
    where: {
      authorId: id,
      replyToId: includeReplies ? {} : null,
      repostToId: includeReposts ? {} : null,
    },
    include: {
      author: true,
    },
  });
  res.status(200).json(posts);
};

/**
 * GET /accounts/:id/followees
 */
export const getAccountFollowees = async (req: Request, res: Response) => {
  if (req.params.id === undefined) {
    return res.status(400).json({ message: "id is required" });
  }
  const id = parseInt(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "id is not an integer" });
  }
  const account = await prisma.account.findUnique({ where: { id } });
  if (account === null) {
    return res.status(404).json({ message: "Account not found" });
  }

  const followees = await prisma.following.findMany({
    where: {
      followerId: id,
    },
    include: {
      followee: true,
    },
  });
  res.status(200).json(followees);
};

/**
 * GET /accounts/:id/followers
 */
export const getAccountFollowers = async (req: Request, res: Response) => {
  if (req.params.id === undefined) {
    return res.status(400).json({ message: "id is required" });
  }
  const id = parseInt(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "id is not an integer" });
  }
  const account = await prisma.account.findUnique({ where: { id } });
  if (account === null) {
    return res.status(404).json({ message: "Account not found" });
  }

  const followers = await prisma.following.findMany({
    where: {
      followeeId: id,
    },
    include: {
      follower: true,
    },
  });
  res.status(200).json(followers);
};

/**
 * 与えられた Username を持つアカウントが存在するならば true を、そうでなければ false を返します。
 */
function accountWithUsernameExists(username: string): Promise<boolean> {
  return prisma.account
    .count({ where: { username } })
    .then((count) => count > 0);
}
