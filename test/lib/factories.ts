import {
  Account,
  Blocking,
  Following,
  Like,
  Post,
  Prisma,
  User,
} from "@prisma/client";
import prisma from "../../src/lib/prisma";
import { Factory } from "fishery";
import { createLike } from "../../src/services/create-like";
import assert from "assert";
import { createPost } from "../../src/services/create-post";
import { randomUUID } from "crypto";
import { createFollowing } from "../../src/services/create-following";
import { createBlocking } from "../../src/services/create-blocking";
import { createKeyPair } from "../../src/lib/auth";
import {
  createExternalAccount,
  createLocalAccount,
} from "../../src/services/create-account";
import { randomUuidWithoutHyphen } from "../../src/lib/random-uuid-without-hyphen";

const ID_UNASSIGNED = -1;
/**
 * "password" をハッシュ化したものの一つ
 */
const HASHED_PASSWORD_UNASSIGNED =
  "$argon2id$v=19$m=19456,t=2,p=1$Rmu7iu0nocJQLBwdtCTJzw$L2CnIC7SR9+VkszJ71EZ8agmo1T8tts+A9gx3JPeMNg";

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
  {
    userId: number;
    username: string;
  },
  never,
  Account
>(({ onCreate }) => {
  onCreate(async (account) => {
    if (account.userId === ID_UNASSIGNED) {
      const user = await userFactory.create();
      account.userId = user.id;
    }

    return createLocalAccount(account.username, account.userId);
  });

  const username = `user${randomUUID().replaceAll("-", "")}`;
  return {
    userId: ID_UNASSIGNED,
    username: username,
  };
});

export const externalAccountFactory = Factory.define<
  Prisma.AccountCreateArgs["data"],
  never,
  Account
>(({ onCreate }) => {
  onCreate(async (account) => {
    if (account.userId === ID_UNASSIGNED) {
      const user = await userFactory.create();
      account.userId = user.id;
    }

    return await createExternalAccount(
      account.username,
      account.host,
      account.apid,
      account.inboxUrl,
      account.publicKey
    );
  });

  const host = "external.example.com";
  const username = `user${randomUuidWithoutHyphen()}`;
  return {
    userId: ID_UNASSIGNED,
    host: host,
    apid: `https://${host}/accounts/${username}`,
    inboxUrl: `https://${host}/accounts/${username}/inbox`,
    publicKey: createKeyPair()[0],
    username: username,
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

export const followingFactory = Factory.define<
  Prisma.FollowingCreateArgs["data"],
  never,
  Following
>(({ onCreate }) => {
  onCreate(async (following) => {
    if (
      following.followerId === undefined ||
      following.followerId === ID_UNASSIGNED
    ) {
      const account = await accountFactory.create();
      following.followerId = account.id;
    }
    if (
      following.followeeId === undefined ||
      following.followeeId === ID_UNASSIGNED
    ) {
      const account = await accountFactory.create();
      following.followeeId = account.id;
    }

    return createFollowing(following.followeeId, following.followerId);
  });

  return {
    followerId: ID_UNASSIGNED,
    followeeId: ID_UNASSIGNED,
  };
});

export const blockingFactory = Factory.define<
  Prisma.BlockingCreateArgs["data"],
  never,
  Blocking
>(({ onCreate }) => {
  onCreate(async (blocking) => {
    if (
      blocking.blockerId === undefined ||
      blocking.blockerId === ID_UNASSIGNED
    ) {
      const account = await accountFactory.create();
      blocking.blockerId = account.id;
    }
    if (
      blocking.blockeeId === undefined ||
      blocking.blockeeId === ID_UNASSIGNED
    ) {
      const account = await accountFactory.create();
      blocking.blockeeId = account.id;
    }

    return createBlocking(blocking.blockeeId, blocking.blockerId);
  });

  return {
    blockerId: ID_UNASSIGNED,
    blockeeId: ID_UNASSIGNED,
  };
});
