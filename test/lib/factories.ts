import { Account, Like, Post, Prisma } from "@prisma/client";
import prisma from "../../src/lib/prisma";
import { Factory } from "fishery";
import { createLike } from "../../src/services/create-like";
import assert from "assert";
import { createPost } from "../../src/services/create-post";
import { randomUUID } from "crypto";

const ID_UNASSIGNED = -1;

export const accountFactory = Factory.define<
  Prisma.AccountCreateArgs["data"],
  never,
  Account
>(({ onCreate }) => {
  onCreate((account) => {
    return prisma.account.create({ data: account });
  });

  return {
    username: `user${randomUUID().replaceAll("-", "")}`,
  };
});

export const postFactory = Factory.define<
  Prisma.PostCreateArgs["data"],
  never,
  Post
>(({ onCreate, sequence }) => {
  onCreate(async (candidate) => {
    if (candidate.authorId === ID_UNASSIGNED) {
      const account = await accountFactory.create();
      candidate.authorId = account.id;
    }

    return createPost(candidate);
  });

  return {
    authorId: ID_UNASSIGNED,
    content: `post #${sequence}`,
  };
});

export const likeFactory = Factory.define<
  Prisma.LikeCreateArgs["data"],
  never,
  Like
>(({ onCreate }) => {
  onCreate(async (like) => {
    // like.postId が undefined であるはずがないと考えているので、ここでその可能性を消す
    assert(like.postId !== undefined);

    if (like.postId === ID_UNASSIGNED) {
      const post = await postFactory.create();
      like.postId = post.id;
    }
    if (like.likedById === ID_UNASSIGNED) {
      const account = await accountFactory.create();
      like.likedById = account.id;
    }

    return createLike(like.postId, like.likedById);
  });
  return {
    postId: ID_UNASSIGNED,
    likedById: ID_UNASSIGNED,
  };
});
