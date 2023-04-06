import { Account, Like, Post, Prisma, User } from "@prisma/client";
import prisma from "../../src/lib/prisma";
import { Factory } from "fishery";
import { createLike } from "../../src/services/create-like";
import assert from "assert";
import { createPost } from "../../src/services/create-post";
import { randomUUID } from "crypto";

const ID_UNASSIGNED = -1;
/**
 * "password" をハッシュ化したものの一つ
 */
const HASHED_PASSWORD_UNASSIGNED =
  "$argon2id$v=19$m=19456,t=2,p=1$wbgeR4EU53OL7DbVHonNCg$SddHOew3cOdJNpmP6QRqKF89aDD3gNlgIfBZafcNq3";

export const userFactory = Factory.define<
  Prisma.UserCreateArgs["data"],
  never,
  User
>(({ onCreate }) => {
  onCreate((user) => {
    return prisma.user.create({ data: user });
  });

  return {
    hashedPassword: HASHED_PASSWORD_UNASSIGNED,
  };
});

export const accountFactory = Factory.define<
  Prisma.AccountCreateArgs["data"],
  never,
  Account
>(({ onCreate }) => {
  onCreate(async (account) => {
    if (account.userId === ID_UNASSIGNED) {
      const user = await userFactory.create();
      account.userId = user.id;
    }
    return prisma.account.create({ data: account });
  });

  return {
    userId: ID_UNASSIGNED,
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
