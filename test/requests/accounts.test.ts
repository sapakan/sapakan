import { Account, Post } from "@prisma/client";
import supertest from "supertest";
import * as accountsController from "../../src/controllers/accounts";
import {
  accountFactory,
  followingFactory,
  likeFactory,
  postFactory,
} from "../lib/factories";
import { toJSONObject } from "../lib/to-json-object";
import app from "../../src/app";

describe(accountsController.getAccount, () => {
  test("対応する ID のアカウントの情報を取得できる", async () => {
    const account = await accountFactory.create();

    const response = await supertest(app).get(`/accounts/${account.id}`);

    expect(response.statusCode).toEqual(200);

    const resAccount: Account = response.body;
    expect(resAccount).toEqual(expect.objectContaining(toJSONObject(account)));
  });

  test("対応する ID のアカウントの情報がないときは 404 を返す", async () => {
    const response = await supertest(app).get(`/accounts/0`);

    expect(response.statusCode).toEqual(404);
  });
});

describe(accountsController.getAccountLikes, () => {
  test("対応する ID の Account の like を取得できる", async () => {
    const account = await accountFactory.create();
    const posts = await postFactory.createList(2, { authorId: account.id });

    await likeFactory.create({ postId: posts[0].id, likedById: account.id });
    await likeFactory.create({ postId: posts[1].id, likedById: account.id });

    const response = await supertest(app).get(`/accounts/${account.id}/likes`);

    expect(response.statusCode).toEqual(200);

    const resLikes: unknown[] = response.body;
    expect(resLikes.length).toEqual(2);
    expect(resLikes).toContainEqual(
      expect.objectContaining({ postId: posts[0].id, likedById: account.id })
    );
    expect(resLikes).toContainEqual(
      expect.objectContaining({ postId: posts[1].id, likedById: account.id })
    );
  });

  test("存在しない ID の Account の like を取得しようとしたら 404 を返す", async () => {
    const response = await supertest(app).get(`/accounts/0/likes`);

    expect(response.statusCode).toEqual(404);
    expect(response.body).toEqual({ message: "Account not found" });
  });

  describe("不正な ID が与えられた場合は 400 を返す", () => {
    test("ID が abc のとき", async () => {
      const response = await supertest(app).get(`/accounts/abc/likes`);

      expect(response.statusCode).toEqual(400);
      expect(response.body).toEqual({
        message: "id is not an integer",
      });
    });
  });
});

describe(accountsController.getAccountPosts, () => {
  describe("対応する ID のアカウントの投稿を取得するとき", () => {
    let account: Account;
    let postWithReply: Post;
    let postWithRepost: Post;
    let replyingPost: Post;
    // （引用なし）Repost
    let repostingPost: Post;
    // 引用 Repost
    let repostingPostQuote: Post;

    beforeEach(async () => {
      account = await accountFactory.create();
      // 以下の投稿を 1 つずつ作成する
      // - 返信が付いていない投稿
      // - 返信が付いている投稿
      // - Repost されている投稿
      [, postWithReply, postWithRepost] = await postFactory.createList(3, {
        authorId: account.id,
      });

      replyingPost = await postFactory.create({
        authorId: account.id,
        replyToId: postWithReply.id,
      });

      repostingPost = await postFactory.create({
        authorId: account.id,
        repostToId: postWithRepost.id,
      });

      repostingPostQuote = await postFactory.create({
        authorId: account.id,
        repostToId: postWithRepost.id,
        content: "quoting",
      });
    });

    test("リプライを含めた投稿を取得するとき、リプライを含む投稿を返す", async () => {
      const response = await supertest(app).get(
        `/accounts/${account.id}/posts?includeReplies=true`
      );

      expect(response.statusCode).toEqual(200);
      const resPosts: unknown[] = response.body;

      expect(resPosts.length).toEqual(4);
      // includeReposts を指定していないときのデフォルトは includeReposts: false の挙動になる
      expect(resPosts).toContainEqual(
        expect.objectContaining(toJSONObject(replyingPost))
      );
    });

    test("リプライを含めた投稿を取得しないとき、リプライを含む投稿を返さない", async () => {
      const response = await supertest(app).get(
        `/accounts/${account.id}/posts?includeReplies=false`
      );

      expect(response.statusCode).toEqual(200);
      const resPosts: unknown[] = response.body;

      expect(resPosts.length).toEqual(3);
      expect(resPosts).not.toContainEqual(
        expect.objectContaining(toJSONObject(replyingPost))
      );
    });

    test("Repost を含めた投稿を取得するとき、Repost を含む投稿を返す", async () => {
      const response = await supertest(app).get(
        `/accounts/${account.id}/posts?includeReposts=true`
      );

      expect(response.statusCode).toEqual(200);
      const resPosts: unknown[] = response.body;

      expect(resPosts.length).toEqual(5);
      // includeReplies を指定していないときのデフォルトは includeReplies: false の挙動になる
      expect(resPosts).toContainEqual(
        expect.objectContaining(toJSONObject(repostingPost))
      );
      expect(resPosts).toContainEqual(
        expect.objectContaining(toJSONObject(repostingPostQuote))
      );
    });

    test("Repost を含めた投稿を取得しないとき、Repost を含む投稿を返さない", async () => {
      const response = await supertest(app).get(
        `/accounts/${account.id}/posts?includeReposts=false`
      );

      expect(response.statusCode).toEqual(200);
      const resPosts: unknown[] = response.body;

      expect(resPosts.length).toEqual(3);
      expect(resPosts).not.toContainEqual(
        expect.objectContaining(toJSONObject(repostingPost))
      );
      expect(resPosts).not.toContainEqual(
        expect.objectContaining(toJSONObject(repostingPostQuote))
      );
    });

    test("別の ID のアカウントの投稿を含まない", async () => {
      const anotherAccount = await accountFactory.create();
      const anotherAccountPost = await postFactory.create({
        authorId: anotherAccount.id,
      });

      const response = await supertest(app).get(
        `/accounts/${account.id}/posts?includeReplies=true`
      );

      expect(response.statusCode).toEqual(200);
      const resPosts: unknown[] = response.body;

      expect(resPosts).not.toContainEqual(
        expect.objectContaining({
          id: anotherAccountPost.id,
        })
      );
    });

    test("不正な投稿の ID を指定したときに 400 を返す", async () => {
      const response = await supertest(app).get(`/accounts/abc/posts`);

      expect(response.statusCode).toEqual(400);
      expect(response.body).toEqual({
        message: "id is not an integer",
      });
    });
  });
});

describe("GET /accounts/:id/followees", () => {
  test("存在する ID の Account の followees を取得できる", async () => {
    const account = await accountFactory.create();
    const followees = await accountFactory.createList(2);

    await followingFactory.create({
      followerId: account.id,
      followeeId: followees[0].id,
    });
    await followingFactory.create({
      followerId: account.id,
      followeeId: followees[1].id,
    });

    const response = await supertest(app).get(
      `/accounts/${account.id}/followees`
    );

    expect(response.statusCode).toEqual(200);

    const resFollowees: unknown[] = response.body;
    expect(resFollowees.length).toEqual(2);
    expect(resFollowees).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ followeeId: followees[0].id }),
        expect.objectContaining({ followeeId: followees[1].id }),
      ])
    );
  });

  test("存在しない ID の Account の followees を取得しようとしたら 404 を返す", async () => {
    const response = await supertest(app).get(`/accounts/0/followees`);

    expect(response.statusCode).toEqual(404);
    expect(response.body).toEqual({ message: "Account not found" });
  });

  describe("不正な ID が与えられた場合は 400 を返す", () => {
    test("ID が abc のとき", async () => {
      const response = await supertest(app).get(`/accounts/abc/followees`);

      expect(response.statusCode).toEqual(400);
      expect(response.body).toEqual({
        message: "id is not an integer",
      });
    });
  });
});

describe("GET /accounts/:id/followers", () => {
  test("存在する ID の Account の followers を取得できる", async () => {
    const account = await accountFactory.create();
    const followers = await accountFactory.createList(2);

    await followingFactory.create({
      followerId: followers[0].id,
      followeeId: account.id,
    });
    await followingFactory.create({
      followerId: followers[1].id,
      followeeId: account.id,
    });

    const response = await supertest(app).get(
      `/accounts/${account.id}/followers`
    );

    expect(response.statusCode).toEqual(200);

    const resFollowers: unknown[] = response.body;
    expect(resFollowers.length).toEqual(2);
    expect(resFollowers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ followerId: followers[0].id }),
        expect.objectContaining({ followerId: followers[1].id }),
      ])
    );
  });

  test("存在しない ID の Account の followers を取得しようとしたら 404 を返す", async () => {
    const response = await supertest(app).get(`/accounts/0/followers`);

    expect(response.statusCode).toEqual(404);
    expect(response.body).toEqual({ message: "Account not found" });
  });

  describe("不正な ID が与えられた場合は 400 を返す", () => {
    test("ID が abc のとき", async () => {
      const response = await supertest(app).get(`/accounts/abc/followers`);

      expect(response.statusCode).toEqual(400);
      expect(response.body).toEqual({
        message: "id is not an integer",
      });
    });
  });
});
