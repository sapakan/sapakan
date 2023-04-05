import { Account, Post } from "@prisma/client";
import httpMocks from "node-mocks-http";
import * as accountsController from "../../src/controllers/accounts";
import { accountFactory, likeFactory, postFactory } from "../lib/factories";
import { toJSONObject } from "../lib/to-json-object";

describe(accountsController.getAccount, () => {
  test("対応する ID のアカウントの情報を取得できる", async () => {
    const account = await accountFactory.create();

    const mockReq = httpMocks.createRequest({
      method: "GET",
      params: { id: account.id },
    });
    const mockRes = httpMocks.createResponse();

    await accountsController.getAccount(mockReq, mockRes);
    expect(mockRes.statusCode).toEqual(200);

    const resAccount: Account = mockRes._getJSONData();
    expect(resAccount).toEqual(expect.objectContaining(toJSONObject(account)));
  });

  test("対応する ID のアカウントの情報がないときは 404 を返す", async () => {
    const mockReq = httpMocks.createRequest({
      method: "GET",
      params: { id: 0 },
    });
    const mockRes = httpMocks.createResponse();

    await accountsController.getAccount(mockReq, mockRes);
    expect(mockRes.statusCode).toEqual(404);
  });
});

describe(accountsController.getAccountLikes, () => {
  test("対応する ID の Account の like を取得できる", async () => {
    const account = await accountFactory.create();
    const posts = await postFactory.createList(2, { authorId: account.id });

    await likeFactory.create({ postId: posts[0].id, likedById: account.id });
    await likeFactory.create({ postId: posts[1].id, likedById: account.id });

    const mockReq = httpMocks.createRequest({
      method: "GET",
      params: {
        id: account.id,
      },
    });
    const mockRes = httpMocks.createResponse();

    await accountsController.getAccountLikes(mockReq, mockRes);
    expect(mockRes.statusCode).toEqual(200);

    const resLikes: unknown[] = mockRes._getJSONData();
    expect(resLikes.length).toEqual(2);
    expect(resLikes).toContainEqual(
      expect.objectContaining({ postId: posts[0].id, likedById: account.id })
    );
    expect(resLikes).toContainEqual(
      expect.objectContaining({ postId: posts[1].id, likedById: account.id })
    );
  });

  test("存在しない ID の Account の like を取得しようとしたら 404 を返す", async () => {
    const mockReq = httpMocks.createRequest({
      method: "GET",
      params: {
        id: 0,
      },
    });
    const mockRes = httpMocks.createResponse();

    await accountsController.getAccountLikes(mockReq, mockRes);
    expect(mockRes.statusCode).toEqual(404);
    expect(mockRes._getJSONData()).toEqual({ message: "Account not found" });
  });

  describe("不正な ID が与えられた場合は 400 を返す", () => {
    test("ID が abc のとき", async () => {
      const accountId = "abc";
      const mockReq = httpMocks.createRequest({
        method: "GET",
        params: {
          id: accountId,
        },
      });
      const mockRes = httpMocks.createResponse();

      await accountsController.getAccountLikes(mockReq, mockRes);
      expect(mockRes.statusCode).toEqual(400);
      expect(mockRes._getJSONData()).toEqual({
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
        content: "quoting"
      });
    });

    test("リプライを含めた投稿を取得するとき、リプライを含む投稿を返す", async () => {
      const mockReq = httpMocks.createRequest({
        method: "GET",
        params: { id: account.id },
        query: { includeReplies: "true" },
      });
      const mockRes = httpMocks.createResponse();

      await accountsController.getAccountPosts(mockReq, mockRes);

      expect(mockRes.statusCode).toEqual(200);
      const resPosts = mockRes._getJSONData();

      expect(resPosts.length).toEqual(4);
      // includeReposts を指定していないときのデフォルトは includeReposts: false の挙動になる
      expect(resPosts).toContainEqual(
        expect.objectContaining(toJSONObject(replyingPost))
      );
    });

    test("リプライを含めた投稿を取得しないとき、リプライを含む投稿を返さない", async () => {
      const mockReq = httpMocks.createRequest({
        method: "GET",
        params: { id: account.id },
        query: { includeReplies: false },
      });
      const mockRes = httpMocks.createResponse();

      await accountsController.getAccountPosts(mockReq, mockRes);

      expect(mockRes.statusCode).toEqual(200);
      const resPosts: unknown[] = mockRes._getJSONData();

      expect(resPosts.length).toEqual(3);
      expect(resPosts).not.toContainEqual(
        expect.objectContaining(toJSONObject(replyingPost))
      );
    });

    test("Repost を含めた投稿を取得するとき、Repost を含む投稿を返す", async () => {
      const mockReq = httpMocks.createRequest({
        method: "GET",
        params: { id: account.id },
        query: { includeReposts: "true" },
      });
      const mockRes = httpMocks.createResponse();

      await accountsController.getAccountPosts(mockReq, mockRes);

      expect(mockRes.statusCode).toEqual(200);
      const resPosts = mockRes._getJSONData();

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
      const mockReq = httpMocks.createRequest({
        method: "GET",
        params: { id: account.id },
        query: { includeReposts: false },
      });
      const mockRes = httpMocks.createResponse();

      await accountsController.getAccountPosts(mockReq, mockRes);

      expect(mockRes.statusCode).toEqual(200);
      const resPosts: unknown[] = mockRes._getJSONData();

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

      const mockReq = httpMocks.createRequest({
        method: "GET",
        params: { id: account.id },
        query: { includeReplies: true },
      });
      const mockRes = httpMocks.createResponse();

      await accountsController.getAccountPosts(mockReq, mockRes);

      expect(mockRes.statusCode).toEqual(200);
      const resPosts = mockRes._getJSONData();

      expect(resPosts).not.toContainEqual(
        expect.objectContaining({
          id: anotherAccountPost.id,
        })
      );
    });
  });
});
