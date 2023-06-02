import { Account, Post, Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { listRemoteFollowerAccounts } from "../lib/follower";
import { deliver } from "./deliver";
import { CreateActivity } from "../@types/activitystreams";
import { config } from "../config";
import assert from "assert";

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
  } else if (
    candidatePost.repostToId !== undefined &&
    candidatePost.repostToId !== null
  ) {
    // Repost を作成するときは Repost 対象の repostCount を increment する
    const [post] = await prisma.$transaction([
      prisma.post.create({
        data: candidatePost,
      }),
      prisma.post.update({
        where: { id: candidatePost.repostToId },
        data: { repostCount: { increment: 1 } },
      }),
    ]);
    return post;
  } else {
    const post = await prisma.post.create({
      data: candidatePost,
      include: { author: true },
    });
    const remoteFollowers = await listRemoteFollowerAccounts(post.authorId);
    remoteFollowers.forEach((rf) => {
      deliver(packCreateActivity(post), post.author, rf.inboxUrl);
    });
    return post;
  }
}

type PostWithAuthor = Post & { author: Account };

function packCreateActivity(post: PostWithAuthor): CreateActivity {
  // repost などではない普通の投稿であるから post.content の中身は必ず存在するはずである
  assert(post.content !== null);

  const createActivity: CreateActivity = {
    "@context": "https://www.w3.org/ns/activitystreams",
    type: "Create",
    id: `${config.url}/posts/${post.id}/create-activity`,
    actor: post.author.apid,
    published: post.createdAt.toISOString(),
    object: {
      "@context": "https://www.w3.org/ns/activitystreams",
      type: "Note",
      id: `${config.url}/posts/${post.id}`,
      content: post.content,
      published: post.createdAt.toISOString(),
      source: {
        content: post.content,
        mediaType: "text/plain",
      },
      summary: "",
      actor: post.author.apid,
      attributedTo: post.author.apid,
      to: ["https://www.w3.org/ns/activitystreams#Public"],
      cc: [],
      url: `${config.url}/posts/${post.id}`,
    },
  };

  return createActivity;
}
