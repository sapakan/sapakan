import { Request, Response } from "express";
import prisma from "../lib/prisma";
import type { Activity, Person } from "../@types/activitystreams";
import { config } from "../config";
import { validateHttpRequest } from "../lib/validate-http-request";

/**
 * GET /accounts/:username
 */
export const getAccount = async (req: Request, res: Response) => {
  const username = req.params.username;
  if (
    req.accepts("application/json", "application/activity+json") ==
    "application/activity+json"
  ) {
    return getAccountWithAcceptActivityJson(res, username);
  }

  const account = await prisma.account.findUnique({
    where: {
      username_host: {
        username,
        host: "localhost",
      },
    },
  });
  if (account === null) {
    return res.status(404).json({ message: "Account not found" });
  }
  res.status(200).json(account);
};

const getAccountWithAcceptActivityJson = async (
  res: Response,
  username: string
) => {
  const account = await prisma.account.findUnique({
    where: {
      username_host: {
        username,
        host: "localhost",
      },
    },
  });
  if (account === null) {
    return res.status(404).send();
  }

  const resBody: Person = {
    "@context": "https://www.w3.org/ns/activitystreams",
    id: `${config.url}/accounts/${account.username}`,
    type: "Person",
    preferredUsername: account.username,
    inbox: `${config.url}/accounts/${account.username}/inbox`,
  };
  return res.status(200).type("application/activity+json").json(resBody);
};

/**
 * GET /accounts/:username/likes
 */
export const getAccountLikes = async (req: Request, res: Response) => {
  const username = req.params.username;
  const account = await prisma.account.findUnique({
    where: {
      username_host: {
        username,
        host: "localhost",
      },
    },
  });
  if (account === null) {
    return res.status(404).json({ message: "Account not found" });
  }

  const likes = await prisma.like.findMany({
    where: {
      likedBy: {
        username: username,
      },
    },
    include: {
      likedBy: true,
      post: true,
    },
  });

  res.status(200).json(likes);
};

/**
 * GET /accounts/:username/posts
 */
export const getAccountPosts = async (req: Request, res: Response) => {
  const username = req.params.username;
  if (username === undefined) {
    return res.status(400).json({ message: "username is required" });
  }

  const account = await prisma.account.findUnique({
    where: {
      username_host: {
        username,
        host: "localhost",
      },
    },
  });
  if (account === null) {
    return res.status(404).json({ message: "Account not found" });
  }

  const includeReplies = req.query.includeReplies === "true";
  const includeReposts = req.query.includeReposts === "true";

  const posts = await prisma.post.findMany({
    where: {
      author: {
        username: username,
      },
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
 * GET /accounts/:username/followees
 */
export const getAccountFollowees = async (req: Request, res: Response) => {
  const username = req.params.username;
  if (username === undefined) {
    return res.status(400).json({ message: "username is required" });
  }

  const account = await prisma.account.findUnique({
    where: {
      username_host: {
        username,
        host: "localhost",
      },
    },
  });
  if (account === null) {
    return res.status(404).json({ message: "Account not found" });
  }

  const followees = await prisma.following.findMany({
    where: {
      follower: {
        username: username,
      },
    },
    include: {
      followee: true,
    },
  });
  res.status(200).json(followees);
};

/**
 * GET /accounts/:username/followers
 */
export const getAccountFollowers = async (req: Request, res: Response) => {
  const username = req.params.username;
  if (username === undefined) {
    return res.status(400).json({ message: "username is required" });
  }

  const account = await prisma.account.findUnique({
    where: {
      username_host: {
        username,
        host: "localhost",
      },
    },
  });
  if (account === null) {
    return res.status(404).json({ message: "Account not found" });
  }

  const followers = await prisma.following.findMany({
    where: {
      followee: {
        username: username,
      },
    },
    include: {
      follower: true,
    },
  });
  res.status(200).json(followers);
};

/**
 * POST /accounts/:username/inbox
 */
export const postAccountInbox = async (req: Request, res: Response) => {
  const username = req.params.username;
  if (username === undefined) {
    return res.status(400).json({ message: "username is required" });
  }

  const account = await prisma.account.findUnique({
    where: {
      username_host: {
        username,
        host: "localhost",
      },
    },
  });
  if (account === null) {
    return res.status(404).json({ message: "Account not found" });
  }

  const valid = await validateHttpRequest(req, req.rawBody);
  if (!valid) {
    return res
      .status(400)
      .json({ message: "request with invalid signature and/or digest" });
  }

  // TODO: フォローの実装ができたら以下のデバッグ出力を削除する
  console.log(JSON.stringify(req.headers));
  console.log(req.body);

  const activity = req.body as Activity;
  if (activity.type === "Follow") {
    // TODO: フォローしてきたアカウントをデータベースに格納する
    // TODO: Accept アクティビティを配送する
  }
  res.status(204).json({ message: "ok" });
};
