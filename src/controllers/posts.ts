import { Response, Request } from "express";
import prisma from "../lib/prisma";
import { createLike, deleteLike } from "../services/create-like";
import { createPost } from "../services/create-post";
import assert from "assert";
import parseIntOrUndefined from "../lib/parse-int-or-undefined";

/**
 * POST /posts
 */
export const postPosts = async (req: Request, res: Response) => {
  // このへんの validation は既存パッケージを使ってもう少しキレイにやりたい
  const authorId = req.user?.accountId;

  const repostToId = parseIntOrUndefined(req.body.repostToId);
  if (req.body.repostToId !== undefined) {
    if (!Number.isInteger(repostToId)) {
      return res.status(400).json({ message: "repostToId is not an integer" });
    }

    const repostTo = await prisma.post.findUnique({
      where: { id: repostToId },
    });
    if (repostTo === null) {
      return res
        .status(400)
        .json({ message: "the reposting post with the given id is not found" });
    }
  }

  const content: string | undefined = req.body.content;
  if (content === undefined && req.body.repostToId === undefined) {
    return res.status(400).json({ message: "content is required" });
  }

  const replyToId = parseIntOrUndefined(req.body.replyToId);
  if (replyToId !== undefined) {
    if (!Number.isInteger(replyToId)) {
      return res.status(400).json({ message: "replyToId is not an integer" });
    }

    const replyTo = await prisma.post.findUnique({ where: { id: replyToId } });
    if (replyTo === null) {
      return res
        .status(400)
        .json({ message: "the replying post with the given id is not found" });
    }
  }

  const author = await prisma.account.findUnique({ where: { id: authorId } });
  if (author === null) {
    return res
      .status(400)
      .json({ message: "author with the given id is not found" });
  }

  const post = await createPost({
    content,
    authorId: author.id,
    replyToId: replyToId,
    repostToId: repostToId,
  });

  res.status(200).json(post);
};

/**
 * GET /posts/:id
 */
export const getPost = async (req: Request, res: Response) => {
  if (req.params.id === undefined) {
    return res.status(400).json({ message: "id is required" });
  }
  const id = parseInt(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "id is not an integer" });
  }

  const post = await prisma.post.findUnique({
    where: { id },
    include: { author: true },
  });
  if (post === null) {
    return res.status(404).json({ message: "not found" });
  }

  // その投稿を自分でいいねしているかを確認する

  const likedById = req.user?.accountId;
  // 前段に ensureLoggedIn があるためここの likedById が undefined になることはない
  assert(likedById !== undefined);

  const like = await prisma.like.findUnique({
    where: {
      postId_likedById: {
        postId: id,
        likedById,
      },
    },
  });

  const isLikedByMe = Boolean(like);

  const resBody = {
    ...post,
    isLikedByMe,
  };
  res.status(200).json(resBody);
};

/**
 * GET /posts/:id/likes
 */
export const getPostLikes = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "id is not an integer" });
  }
  const post = await prisma.post.findUnique({
    where: { id },
    include: { author: true },
  });
  if (post === null) {
    return res.status(404).json({ message: "not found" });
  }

  const likes = await prisma.like.findMany({
    where: { postId: id },
    include: { likedBy: true },
  });

  res.status(200).json(likes);
};

/**
 * POST /posts/:id/likes
 */
export const postPostLikes = async (req: Request, res: Response) => {
  const postId = Number(req.params.id);
  if (Number.isNaN(postId)) {
    return res.status(400).json({ message: "id is not an integer" });
  }

  const likedById = req.user?.accountId;
  // 前段に ensureLoggedIn があるためここの likedById が undefined になることはない
  assert(likedById !== undefined);

  // Like を付ける対象の投稿が存在しないならば 404 を返す
  if (!(await postExists(postId))) {
    return res.status(404).json({ message: "post not found" });
  }

  if (await userAlreadyLiked(postId, likedById)) {
    return res.status(409).json({ message: "already liked" });
  }

  const like = await createLike(postId, likedById);

  res.status(200).json(like);
};

/**
 * DELETE /posts/:id/likes
 */
export const deletePostLikes = async (req: Request, res: Response) => {
  const postId = Number(req.params.id);

  const likedById = req.user?.accountId;
  // 前段に ensureLoggedIn があるためここの likedById が undefined になることはない
  assert(likedById !== undefined);

  // Like を付ける対象の投稿が存在しないならば 404 を返す
  if (!(await postExists(postId))) {
    return res.status(404).json({ message: "post not found" });
  }

  if (!(await userAlreadyLiked(postId, likedById))) {
    return res.status(400).json({ message: "not liked" });
  }

  await deleteLike(postId, likedById);

  res.status(204).send();
};

/**
 * 与えられた postId に紐づく Post が存在するならば true を、そうでなければ false を返します。
 */
async function postExists(postId: number): Promise<boolean> {
  return prisma.post
    .count({ where: { id: postId } })
    .then((count) => count > 0);
}

/**
 * 与えられた postId と likedById に紐づく Like が存在するならば true を、そうでなければ false を返します。
 */
function userAlreadyLiked(postId: number, likedById: number): Promise<boolean> {
  return prisma.like
    .findUnique({
      where: {
        postId_likedById: {
          postId,
          likedById,
        },
      },
    })
    .then((like) => like !== null);
}
