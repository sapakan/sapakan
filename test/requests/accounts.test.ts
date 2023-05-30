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
import { config } from "../../src/config";
import { Person } from "../../src/@types/activitystreams";

describe(accountsController.getAccount, () => {
  describe("Accept ヘッダーが application/activity+json のとき", () => {
    test("対応する username のアカウントの情報を取得できる", async () => {
      const account = await accountFactory.create();

      const response = await supertest(app)
        .get(`/accounts/${account.username}`)
        .set("accept", "application/activity+json");
      expect(response.statusCode).toEqual(200);
      const resBody: Person = response.body;
      expect(resBody).toEqual({
        "@context": "https://www.w3.org/ns/activitystreams",
        id: `${config.url}/accounts/${account.username}`,
        type: "Person",
        preferredUsername: account.username,
        inbox: `${config.url}/accounts/${account.username}/inbox`,
      });
    });

    test("存在しない username のアカウントの情報を取得しようとしたら 404 を返す", async () => {
      const response = await supertest(app)
        .get(`/accounts/not-exists-username`)
        .set("accept", "application/activity+json");
      expect(response.statusCode).toEqual(404);
      expect(response.text).toEqual("");
    });
  });

  describe("Accept ヘッダーが application/json, application/activity+json のとき", () => {
    test("対応する username のアカウントの情報を取得できる", async () => {
      const account = await accountFactory.create();

      const response = await supertest(app)
        .get(`/accounts/${account.username}`)
        .set("accept", "application/json, application/activity+json");
      expect(response.statusCode).toEqual(200);
      // Accept ヘッダーの一番最初にある application/json にのっとって普通に JSON 形式の情報が返ってくる
      const resAccount: Account = response.body;
      expect(resAccount).toEqual(
        expect.objectContaining(toJSONObject(account))
      );
    });
  });

  describe("Accept ヘッダーが application/activity+json, application/json のとき", () => {
    test("対応する username のアカウントの情報を取得できる", async () => {
      const account = await accountFactory.create();

      const response = await supertest(app)
        .get(`/accounts/${account.username}`)
        .set("accept", "application/activity+json, application/json");
      expect(response.statusCode).toEqual(200);
      // Accept ヘッダーの一番最初にある application/activity+json にのっとって Activity Streams 形式の情報が返ってくる
      const resBody: Person = response.body;
      expect(resBody).toEqual({
        "@context": "https://www.w3.org/ns/activitystreams",
        id: `${config.url}/accounts/${account.username}`,
        type: "Person",
        preferredUsername: account.username,
        inbox: `${config.url}/accounts/${account.username}/inbox`,
      });
    });
  });

  describe("Accept ヘッダーが application/json のとき", () => {
    test("対応する username のアカウントの情報を取得できる", async () => {
      const account = await accountFactory.create();

      const response = await supertest(app).get(
        `/accounts/${account.username}`
      );

      expect(response.statusCode).toEqual(200);

      const resAccount: Account = response.body;
      expect(resAccount).toEqual(
        expect.objectContaining(toJSONObject(account))
      );
    });

    test("対応する username のアカウントの情報がないときは 404 を返す", async () => {
      const response = await supertest(app).get(`/accounts/0`);

      expect(response.statusCode).toEqual(404);
    });
  });

  describe("Accept ヘッダーが */* のとき", () => {
    test("対応する username のアカウントの情報を取得できる", async () => {
      const account = await accountFactory.create();

      const response = await supertest(app).get(
        `/accounts/${account.username}`
      );

      expect(response.statusCode).toEqual(200);

      const resAccount: Account = response.body;
      expect(resAccount).toEqual(
        expect.objectContaining(toJSONObject(account))
      );
    });

    test("対応する username のアカウントの情報がないときは 404 を返す", async () => {
      const response = await supertest(app).get(`/accounts/0`);

      expect(response.statusCode).toEqual(404);
    });
  });

  describe("Accept ヘッダーが指定されていないとき", () => {
    test("対応する username のアカウントの情報を取得できる", async () => {
      const account = await accountFactory.create();

      const response = await supertest(app).get(
        `/accounts/${account.username}`
      );

      expect(response.statusCode).toEqual(200);

      const resAccount: Account = response.body;
      expect(resAccount).toEqual(
        expect.objectContaining(toJSONObject(account))
      );
    });

    test("対応する username のアカウントの情報がないときは 404 を返す", async () => {
      const response = await supertest(app).get(`/accounts/0`);

      expect(response.statusCode).toEqual(404);
    });
  });
});

describe(accountsController.getAccountLikes, () => {
  test("対応する username の Account の like を取得できる", async () => {
    const account = await accountFactory.create();
    const posts = await postFactory.createList(2, { authorId: account.id });

    await likeFactory.create({ postId: posts[0].id, likedById: account.id });
    await likeFactory.create({ postId: posts[1].id, likedById: account.id });

    const response = await supertest(app).get(
      `/accounts/${account.username}/likes`
    );

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

  test("存在しない username の Account の like を取得しようとしたら 404 を返す", async () => {
    const response = await supertest(app).get(
      `/accounts/not-exists-username/likes`
    );

    expect(response.statusCode).toEqual(404);
    expect(response.body).toEqual({ message: "Account not found" });
  });
});

describe(accountsController.getAccountPosts, () => {
  describe("対応する username のアカウントの投稿を取得するとき", () => {
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
        `/accounts/${account.username}/posts?includeReplies=true`
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
        `/accounts/${account.username}/posts?includeReplies=false`
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
        `/accounts/${account.username}/posts?includeReposts=true`
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
        `/accounts/${account.username}/posts?includeReposts=false`
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

    test("別の username のアカウントの投稿を含まない", async () => {
      const anotherAccount = await accountFactory.create();
      const anotherAccountPost = await postFactory.create({
        authorId: anotherAccount.id,
      });

      const response = await supertest(app).get(
        `/accounts/${account.username}/posts?includeReplies=true`
      );

      expect(response.statusCode).toEqual(200);
      const resPosts: unknown[] = response.body;

      expect(resPosts).not.toContainEqual(
        expect.objectContaining({
          id: anotherAccountPost.id,
        })
      );
    });
  });
});

describe("GET /accounts/:username/followees", () => {
  test("存在する username の Account の followees を取得できる", async () => {
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
      `/accounts/${account.username}/followees`
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

  test("存在しない username の Account の followees を取得しようとしたら 404 を返す", async () => {
    const response = await supertest(app).get(
      `/accounts/not-exists-username/followees`
    );

    expect(response.statusCode).toEqual(404);
    expect(response.body).toEqual({ message: "Account not found" });
  });
});

describe("GET /accounts/:username/followers", () => {
  test("存在する username の Account の followers を取得できる", async () => {
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
      `/accounts/${account.username}/followers`
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

  test("存在しない username の Account の followers を取得しようとしたら 404 を返す", async () => {
    const response = await supertest(app).get(
      `/accounts/not-exists-username/followers`
    );

    expect(response.statusCode).toEqual(404);
    expect(response.body).toEqual({ message: "Account not found" });
  });
});
