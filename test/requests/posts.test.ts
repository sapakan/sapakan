import { Like } from "@prisma/client";
import httpMocks from "node-mocks-http";
import * as postsController from "../../src/controllers/posts";
import prisma from "../../src/lib/prisma";
import { accountFactory, postFactory, likeFactory, userFactory } from "../lib/factories";

describe(postsController.postPosts, () => {
  test("与えられた authorId と content に基いて投稿を作成する", async () => {
    const account = await accountFactory.create();
    const content = "hello!";

    const mockReq = httpMocks.createRequest({
      method: "POST",
      body: {
        authorId: account.id,
        content,
      },
    });
    const mockRes = httpMocks.createResponse();

    await postsController.postPosts(mockReq, mockRes);
    expect(mockRes.statusCode).toEqual(200);
    expect(mockRes._getJSONData()).toEqual(
      expect.objectContaining({ content, authorId: account.id })
    );
  });

  test("ID が与えられていない場合は 400 を返す", async () => {
    const mockReq = httpMocks.createRequest({
      method: "POST",
    });
    const mockRes = httpMocks.createResponse();

    await postsController.postPosts(mockReq, mockRes);
    expect(mockRes.statusCode).toEqual(400);
    expect(mockRes._getJSONData()).toEqual({ message: "authorId is required" });
  });

  test("ID が整数として解釈できない文字列だった場合は 400 を返す", async () => {
    const mockReq = httpMocks.createRequest({
      method: "POST",
      body: {
        authorId: "example",
      },
    });
    const mockRes = httpMocks.createResponse();

    await postsController.postPosts(mockReq, mockRes);
    expect(mockRes.statusCode).toEqual(400);
    expect(mockRes._getJSONData()).toEqual({
      message: "authorId is not an integer",
    });
  });

  test("content が指定されていない場合は 400 を返す", async () => {
    const mockReq = httpMocks.createRequest({
      method: "POST",
      body: {
        authorId: 123,
      },
    });
    const mockRes = httpMocks.createResponse();

    await postsController.postPosts(mockReq, mockRes);
    expect(mockRes.statusCode).toEqual(400);
    expect(mockRes._getJSONData()).toEqual({
      message: "content is required",
    });
  });

  test("authorId に対応する Account が無い場合は 400 を返す", async () => {
    const mockReq = httpMocks.createRequest({
      method: "POST",
      body: {
        authorId: 0,
        content: "example content",
      },
    });
    const mockRes = httpMocks.createResponse();

    await postsController.postPosts(mockReq, mockRes);
    expect(mockRes.statusCode).toEqual(400);
    expect(mockRes._getJSONData()).toEqual({
      message: "author with the given id is not found",
    });
  });

  describe("replyToId が指定されているとき", () => {
    test("replyToId に与えられた Post の ID が格納された投稿を作成する", async () => {
      const account = await accountFactory.create();
      const post = await postFactory.create();
      const content = "replying";

      const mockReq = httpMocks.createRequest({
        method: "POST",
        body: {
          authorId: account.id,
          content,
          replyToId: post.id,
        },
      });
      const mockRes = httpMocks.createResponse();

      await postsController.postPosts(mockReq, mockRes);
      expect(mockRes.statusCode).toEqual(200);
      expect(mockRes._getJSONData()).toEqual(
        expect.objectContaining({
          authorId: account.id,
          content,
          replyToId: post.id,
        })
      );
    });

    test("replyToId に対応する Post が無い場合は 400 を返す", async () => {
      const account = await accountFactory.create();
      const mockReq = httpMocks.createRequest({
        method: "POST",
        body: {
          authorId: account.id,
          content: "replying",
          replyToId: 0,
        },
      });
      const mockRes = httpMocks.createResponse();

      await postsController.postPosts(mockReq, mockRes);
      expect(mockRes.statusCode).toEqual(400);
      expect(mockRes._getJSONData()).toEqual({
        message: "the replying post with the given id is not found",
      });
    });
  });

  describe("repostToId が指定されているとき", () => {
    test("repostToId に与えられた Post の ID が格納された単純な Repost を作成する", async () => {
      const account = await accountFactory.create();
      const post = await postFactory.create();

      const mockReq = httpMocks.createRequest({
        method: "POST",
        body: {
          authorId: account.id,
          repostToId: post.id,
          // 引用 Repost **ではない** ので content を指定しない
        },
      });
      const mockRes = httpMocks.createResponse();

      await postsController.postPosts(mockReq, mockRes);
      expect(mockRes.statusCode).toEqual(200);
      expect(mockRes._getJSONData()).toEqual(
        expect.objectContaining({
          authorId: account.id,
          repostToId: post.id,
        })
      );
    });

    test("repostToId に与えられた Post の ID が格納された引用 Repost を作成する", async () => {
      const account = await accountFactory.create();
      const post = await postFactory.create();
      const content = "reposting";

      const mockReq = httpMocks.createRequest({
        method: "POST",
        body: {
          authorId: account.id,
          content,
          repostToId: post.id,
        },
      });
      const mockRes = httpMocks.createResponse();

      await postsController.postPosts(mockReq, mockRes);
      expect(mockRes.statusCode).toEqual(200);
      expect(mockRes._getJSONData()).toEqual(
        expect.objectContaining({
          authorId: account.id,
          content,
          repostToId: post.id,
        })
      );
    });

    test("repostToId に対応する Post が無い場合は 400 を返す", async () => {
      const account = await accountFactory.create();
      const mockReq = httpMocks.createRequest({
        method: "POST",
        body: {
          authorId: account.id,
          content: "reposting",
          repostToId: 0,
        },
      });
      const mockRes = httpMocks.createResponse();

      await postsController.postPosts(mockReq, mockRes);
      expect(mockRes.statusCode).toEqual(400);
      expect(mockRes._getJSONData()).toEqual({
        message: "the reposting post with the given id is not found",
      });
    });
  });
});
describe(postsController.getPost, () => {
  test("与えられた ID に対応する投稿の情報を返す", async () => {
    const post = await postFactory.create();

    const mockReq = httpMocks.createRequest({
      method: "GET",
      params: { id: post.id },
    });
    const mockRes = httpMocks.createResponse();

    await postsController.getPost(mockReq, mockRes);
    expect(mockRes.statusCode).toEqual(200);

    const resPost = mockRes._getJSONData();

    expect(resPost).toEqual(
      expect.objectContaining({
        content: post.content,
        authorId: post.authorId,
        isLikedByMe: false,
      })
    );
  });

  test("与えられた ID に対応する投稿がないときは 404 を返す", async () => {
    const mockReq = httpMocks.createRequest({
      method: "GET",
      params: { id: 0 },
    });
    const mockRes = httpMocks.createResponse();

    await postsController.getPost(mockReq, mockRes);
    expect(mockRes.statusCode).toEqual(404);
  });
});

describe(postsController.postPostLikes, () => {
  test("与えられた ID に対応する投稿にいいねする", async () => {
    const post = await postFactory.create();

    const mockReq = httpMocks.createRequest({
      method: "POST",
      params: {
        id: post.id,
      },
    });
    const mockRes = httpMocks.createResponse();

    await postsController.postPostLikes(mockReq, mockRes);
    expect(mockRes.statusCode).toEqual(200);

    const resLike = mockRes._getJSONData();
    const expected: Partial<Like> = {
      postId: post.id,
      likedById: 1, // TODO: アカウント ID が 1 であることに依存しないようなテストを書く
    };
    expect(resLike).toEqual(expect.objectContaining(expected));
  });

  test("与えられた postId に対応する post がないときは 404 を返す", async () => {
    const account = await accountFactory.create();

    const mockReq = httpMocks.createRequest({
      method: "POST",
      body: {
        likedById: account.id,
      },
      params: {
        id: 0,
      },
    });
    const mockRes = httpMocks.createResponse();

    await postsController.postPostLikes(mockReq, mockRes);
    expect(mockRes.statusCode).toEqual(404);
    expect(mockRes._getJSONData()).toEqual({
      message: "post not found",
    });
  });

  describe("不正な id が与えられた場合は 400 を返す", () => {
    test("id が abc のとき", async () => {
      const postId = "abc";
      const mockReq = httpMocks.createRequest({
        method: "POST",
        params: {
          id: postId,
        },
      });
      const mockRes = httpMocks.createResponse();

      await postsController.postPostLikes(mockReq, mockRes);
      expect(mockRes.statusCode).toEqual(400);
      expect(mockRes._getJSONData()).toEqual({
        message: "id is not an integer",
      });
    });
  });

  test("与えられた postId に対応する post を既に like していたら 400 を返す", async () => {
    // TODO: アカウント ID が 1 であることに依存しないようなテストを書く
    // 現状は認証機能がないので、このエンドポイントを利用する際には ID = 1 のアカウントによるものとして振る舞わせている
    const account = await prisma.account.upsert({
      where: { id: 1 },
      update: { username: "testuser1" },
      create: { username: "testuser1", userId: (await userFactory.create()).id },
    });
    const post = await postFactory.create();
    await likeFactory.create({ likedById: account.id, postId: post.id });

    const mockReq = httpMocks.createRequest({
      method: "POST",
      body: {
        likedById: account.id,
      },
      params: {
        id: post.id,
      },
    });
    const mockRes = httpMocks.createResponse();

    await postsController.postPostLikes(mockReq, mockRes);
    expect(mockRes.statusCode).toEqual(409);
    expect(mockRes._getJSONData()).toEqual({
      message: "already liked",
    });
  });

  // TODO: 「like したら対象の post の likeCount がインクリメントされる」のテスト
});

describe(postsController.deletePostLikes, () => {
  test("与えられた ID に対応する投稿へのいいねを削除する", async () => {
    // TODO: アカウント ID が 1 であることに依存しないようなテストを書く
    // 現状は認証機能がないので、このエンドポイントを利用する際には ID = 1 のアカウントによるものとして振る舞わせている
    const account = await prisma.account.upsert({
      where: { id: 1 },
      update: { username: "testuser1" },
      create: { username: "testuser1", userId: (await userFactory.create()).id },
    });
    const post = await postFactory.create({ authorId: account.id });
    await likeFactory.create({ postId: post.id, likedById: account.id });

    const mockReq = httpMocks.createRequest({
      // 認証などが無いため暗黙的に ID が 1 のアカウントとして振る舞ってもらう
      method: "DELETE",
      params: {
        id: post.id,
      },
    });
    const mockRes = httpMocks.createResponse();

    await postsController.deletePostLikes(mockReq, mockRes);
    expect(mockRes.statusCode).toEqual(204);

    const likedPost = await prisma.post.findUnique({ where: { id: post.id } });
    expect(likedPost?.likeCount).toBe(0);
  });

  // TODO: prisma.like.delete に失敗したときの挙動を確認する
});
