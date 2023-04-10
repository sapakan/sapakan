import { Like } from "@prisma/client";
import httpMocks from "node-mocks-http";
import * as postsController from "../../src/controllers/posts";
import prisma from "../../src/lib/prisma";
import {
  accountFactory,
  postFactory,
  likeFactory,
  userFactory,
} from "../lib/factories";
import supertest from "supertest";
import app from "../../src/app";
import {
  getLoggedInAgent,
  getLoggedInAgentAndAccount,
} from "../lib/get-logged-in-agent";
import { toJSONObject } from "../lib/to-json-object";

describe("POST /posts", () => {
  test("与えられた content に基いて投稿を作成する", async () => {
    const content = "hello!";
    const [agent, account] = await getLoggedInAgentAndAccount(app);

    const response = await agent.post(`/posts`).type("form").send({
      content: content,
    });

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual(
      expect.objectContaining({ content: content, authorId: account.id })
    );
  });

  test("ログインしていない場合は 302 を返す", async () => {
    const response = await supertest(app).post(`/posts`);

    expect(response.statusCode).toEqual(302);
  });

  test("content が指定されていない場合は 400 を返す", async () => {
    const agent = await getLoggedInAgent(app);
    const response = await agent.post(`/posts`);

    expect(response.statusCode).toEqual(400);
    expect(response.body).toEqual({
      message: "content is required",
    });
  });

  describe("replyToId が指定されているとき", () => {
    test("replyToId に与えられた Post の ID が格納された投稿を作成する", async () => {
      const post = await postFactory.create();
      const content = "replying";

      const [agent, account] = await getLoggedInAgentAndAccount(app);
      const response = await agent.post(`/posts`).type("form").send({
        content: content,
        replyToId: post.id,
      });

      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          authorId: account.id,
          content: content,
          replyToId: post.id,
        })
      );
    });

    test("replyToId に対応する Post が無い場合は 400 を返す", async () => {
      const agent = await getLoggedInAgent(app);
      const response = await agent.post(`/posts`).type("form").send({
        content: "replying",
        replyToId: 0,
      });

      expect(response.statusCode).toEqual(400);
      expect(response.body).toEqual({
        message: "the replying post with the given id is not found",
      });
    });
  });

  describe("repostToId が指定されているとき", () => {
    test("repostToId に与えられた Post の ID が格納された単純な Repost を作成する", async () => {
      const post = await postFactory.create();

      const [agent, account] = await getLoggedInAgentAndAccount(app);
      const response = await agent.post(`/posts`).type("form").send({
        repostToId: post.id,
        // 引用 Repost **ではない** ので content を指定しない
      });

      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          authorId: account.id,
          repostToId: post.id,
        })
      );
    });

    test("repostToId に与えられた Post の ID が格納された引用 Repost を作成する", async () => {
      const post = await postFactory.create();
      const content = "reposting";

      const [agent, account] = await getLoggedInAgentAndAccount(app);
      const response = await agent.post(`/posts`).type("form").send({
        content: content,
        repostToId: post.id,
      });

      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          authorId: account.id,
          content: content,
          repostToId: post.id,
        })
      );
    });

    test("repostToId に対応する Post が無い場合は 400 を返す", async () => {
      const agent = await getLoggedInAgent(app);
      const response = await agent.post(`/posts`).type("form").send({
        content: "reposting",
        repostToId: 0,
      });

      expect(response.statusCode).toEqual(400);
      expect(response.body).toEqual({
        message: "the reposting post with the given id is not found",
      });
    });
  });
});

describe("GET /posts/:id/likes", () => {
  test("与えられた ID に対応する投稿のいいね一覧を返す", async () => {
    const post = await postFactory.create();
    const accounts = await accountFactory.createList(2);
    const likes = [
      await likeFactory.create({ postId: post.id, likedById: accounts[0].id }),
      await likeFactory.create({ postId: post.id, likedById: accounts[1].id }),
    ];

    const response = await supertest(app).get(`/posts/${post.id}/likes`);

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          postId: likes[0].postId,
          likedById: likes[0].likedById,
          createdAt: toJSONObject(likes[0].createdAt),
          likedBy: expect.objectContaining({
            id: accounts[0].id,
          }),
        }),
        expect.objectContaining({
          postId: likes[1].postId,
          likedById: likes[1].likedById,
          createdAt: toJSONObject(likes[1].createdAt),
          likedBy: expect.objectContaining({
            id: accounts[1].id,
          }),
        }),
      ])
    );
  });
  test("存在しない投稿の ID が与えられたら 404 を返す", async () => {
    const response = await supertest(app).get(`/posts/0/likes`);

    expect(response.statusCode).toEqual(404);
  });
  test("不正な ID が与えられたら 400 を返す", async () => {
    const response = await supertest(app).get(`/posts/aaa/likes`);

    expect(response.statusCode).toEqual(400);
  });
});

describe(postsController.getPost, () => {
  test("与えられた ID に対応する投稿の情報を返す", async () => {
    const post = await postFactory.create();

    const response = await supertest(app).get(`/posts/${post.id}`);

    expect(response.statusCode).toEqual(200);

    const resPost: unknown = response.body;

    expect(resPost).toEqual(
      expect.objectContaining({
        content: post.content,
        authorId: post.authorId,
        isLikedByMe: false,
      })
    );
  });

  test("与えられた ID に対応する投稿がないときは 404 を返す", async () => {
    const response = await supertest(app).get(`/posts/0`);

    expect(response.statusCode).toEqual(404);
  });
});

describe("POST /posts/:id/likes", () => {
  test("与えられた ID に対応する投稿にいいねする", async () => {
    const post = await postFactory.create();

    const [agent, account] = await getLoggedInAgentAndAccount(app);
    const response = await agent.post(`/posts/${post.id}/likes`);

    expect(response.statusCode).toEqual(200);

    const resLike: unknown = response.body;
    const expected: Partial<Like> = {
      postId: post.id,
      likedById: account.id,
    };
    expect(resLike).toEqual(expect.objectContaining(expected));
  });

  test("与えられた postId に対応する post がないときは 404 を返す", async () => {
    const agent = await getLoggedInAgent(app);
    const response = await agent.post(`/posts/0/likes`);

    expect(response.statusCode).toEqual(404);
    expect(response.body).toEqual({
      message: "post not found",
    });
  });

  describe("不正な id が与えられた場合は 400 を返す", () => {
    test("id が abc のとき", async () => {
      const postId = "abc";
      const agent = await getLoggedInAgent(app);
      const response = await agent.post(`/posts/${postId}/likes`);

      expect(response.statusCode).toEqual(400);
      expect(response.body).toEqual({
        message: "id is not an integer",
      });
    });
  });

  test("与えられた postId に対応する post を既に like していたら 400 を返す", async () => {
    const [agent, account] = await getLoggedInAgentAndAccount(app);
    const post = await postFactory.create();
    await likeFactory.create({ likedById: account.id, postId: post.id });

    const response = await agent.post(`/posts/${post.id}/likes`);

    expect(response.statusCode).toEqual(409);
    expect(response.body).toEqual({
      message: "already liked",
    });
  });

  test("like したら対象の post の likeCount がインクリメントされる", async () => {
    const agent = await getLoggedInAgent(app);
    const post = await postFactory.create();

    await agent.post(`/posts/${post.id}/likes`);

    const updatedPost = await prisma.post.findUnique({
      where: { id: post.id },
    });
    expect(updatedPost?.likeCount).toEqual(1);
  });

  test("ログインしていない場合は 302 を返す", async () => {
    const response = await supertest(app).post(`/posts/1/likes`);

    expect(response.statusCode).toEqual(302);
  });
});

describe("DELETE /posts/:id/likes", () => {
  test("与えられた ID に対応する投稿へのいいねを削除する", async () => {
    const [agent, account] = await getLoggedInAgentAndAccount(app);
    const post = await postFactory.create({ authorId: account.id });
    await likeFactory.create({ postId: post.id, likedById: account.id });

    const response = await agent.delete(`/posts/${post.id}/likes`);

    expect(response.statusCode).toEqual(204);

    const likedPost = await prisma.post.findUnique({ where: { id: post.id } });
    expect(likedPost?.likeCount).toBe(0);
  });

  test("与えられた ID に対応する投稿へのいいねがないときは 400 を返す", async () => {
    const [agent, account] = await getLoggedInAgentAndAccount(app);
    const post = await postFactory.create({ authorId: account.id });

    const response = await agent.delete(`/posts/${post.id}/likes`);

    expect(response.statusCode).toEqual(400);
    expect(response.body).toEqual({
      message: "not liked",
    });
  });

  test("与えられた ID に対応する投稿がないときは 404 を返す", async () => {
    const agent = await getLoggedInAgent(app);
    const response = await agent.delete(`/posts/0/likes`);

    expect(response.statusCode).toEqual(404);
    expect(response.body).toEqual({
      message: "post not found",
    });
  });

  test("like を消したら対象の post の likedCount がデクリメントされる", async () => {
    // given
    const [agent, account] = await getLoggedInAgentAndAccount(app);
    const anotherAccount = await accountFactory.create();
    const post = await postFactory.create({ authorId: account.id });
    await likeFactory.create({ postId: post.id, likedById: account.id });
    await likeFactory.create({ postId: post.id, likedById: anotherAccount.id });

    // when
    await agent.delete(`/posts/${post.id}/likes`);

    // then
    const updatedPost = await prisma.post.findUnique({
      where: { id: post.id },
    });
    expect(updatedPost?.likeCount).toEqual(1);
  });

  test("ログインしていない場合は 302 を返す", async () => {
    const response = await supertest(app).delete(`/posts/1/likes`);

    expect(response.statusCode).toEqual(302);
  });
});
