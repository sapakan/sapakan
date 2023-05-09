import supertest from "supertest";
import app from "../../src/app";
import {
  getLoggedInAgent,
  getLoggedInAgentAndAccount,
} from "../lib/get-logged-in-agent";
import {
  accountFactory,
  blockingFactory,
  followingFactory,
} from "../lib/factories";
import prisma from "../../src/lib/prisma";
import assert from "assert";

describe("POST /blockings/block", () => {
  test("ログインしていないときは 302 を返す", async () => {
    const response = await supertest.agent(app).post("/blockings/block");
    expect(response.statusCode).toEqual(302);
  });

  test("与えられた ID のユーザーをブロックできる", async () => {
    // me: ブロックする側
    const [agent, me] = await getLoggedInAgentAndAccount(app);

    // ブロックされる側
    const blockee = await accountFactory.create();

    const response = await agent
      .post("/blockings/block")
      .type("form")
      .send({ blockeeId: blockee.id });

    expect(response.statusCode).toEqual(201);
    const blocking = await prisma.blocking.findUnique({
      where: {
        blockeeId_blockerId: {
          blockerId: me.id,
          blockeeId: blockee.id,
        },
      },
    });
    assert(blocking !== null);
    expect(blocking.blockerId).toEqual(me.id);
    expect(blocking.blockeeId).toEqual(blockee.id);
  });

  test("既にフォローしているユーザーをブロックするとフォロー関係が消える", async () => {
    const [agent, me] = await getLoggedInAgentAndAccount(app);
    const blockee = await accountFactory.create();

    await followingFactory.create({
      followerId: me.id,
      followeeId: blockee.id,
    });

    const response = await agent
      .post("/blockings/block")
      .type("form")
      .send({ blockeeId: blockee.id });

    expect(response.statusCode).toEqual(201);
    const followingMeToBlockee = await prisma.following.findUnique({
      where: {
        followeeId_followerId: {
          followerId: me.id,
          followeeId: blockee.id,
        },
      },
    });
    assert(followingMeToBlockee === null);
  });

  test("既にフォローされているユーザーをブロックするとフォロー関係が消える", async () => {
    const [agent, me] = await getLoggedInAgentAndAccount(app);
    const blockee = await accountFactory.create();

    await followingFactory.create({
      followerId: blockee.id,
      followeeId: me.id,
    });

    const response = await agent
      .post("/blockings/block")
      .type("form")
      .send({ blockeeId: blockee.id });

    expect(response.statusCode).toEqual(201);
    const followingBlockeeToMe = await prisma.following.findUnique({
      where: {
        followeeId_followerId: {
          followerId: blockee.id,
          followeeId: me.id,
        },
      },
    });
    assert(followingBlockeeToMe === null);
  });

  test("与えられた ID のユーザーが存在しないときは 400 を返す", async () => {
    const agent = await getLoggedInAgent(app);

    const notExistingAccountId = 0;
    const response = await agent
      .post("/blockings/block")
      .type("form")
      .send({ blockeeId: notExistingAccountId });
    expect(response.statusCode).toEqual(400);
    expect(response.body).toEqual({
      message: "blockee with the given id is not found",
    });
  });

  test("与えられた ID が不正な形式の場合は 400 を返す", async () => {
    const agent = await getLoggedInAgent(app);

    const invalidAccountId = "a";
    const request = await agent
      .post("/blockings/block")
      .type("form")
      .send({ blockeeId: invalidAccountId });
    expect(request.statusCode).toEqual(400);
    expect(request.body).toEqual({ message: "blockeeId is not an integer" });
  });

  test("与えられた ID のユーザーが自分自身のときは 400 を返す", async () => {
    const [agent, me] = await getLoggedInAgentAndAccount(app);

    const response = await agent
      .post("/blockings/block")
      .type("form")
      .send({ blockeeId: me.id });

    expect(response.statusCode).toEqual(400);
    expect(response.body).toEqual({ message: "cannot block yourself" });
  });

  test("既にブロックしているユーザーをブロックしようとしたときは 400 を返す", async () => {
    const [agent, me] = await getLoggedInAgentAndAccount(app);
    const blockee = await accountFactory.create();
    await blockingFactory.create({
      blockeeId: blockee.id,
      blockerId: me.id,
    });

    const response = await agent
      .post("/blockings/block")
      .type("form")
      .send({ blockeeId: blockee.id });
    expect(response.statusCode).toEqual(400);
    expect(response.body).toEqual({ message: "already blocked" });
  });
});

describe("POST /blockings/unblock", () => {
  test("ログインしていないときは 302 を返す", async () => {
    const response = await supertest.agent(app).post("/blockings/unblock");
    expect(response.statusCode).toEqual(302);
  });

  test("与えられた ID のユーザーをブロックを解除できる", async () => {
    const [agent, me] = await getLoggedInAgentAndAccount(app);
    const blockee = await accountFactory.create();

    await blockingFactory.create({
      blockerId: me.id,
      blockeeId: blockee.id,
    });

    const response = await agent
      .post("/blockings/unblock")
      .type("form")
      .send({ blockeeId: blockee.id });

    expect(response.statusCode).toEqual(201);
    const blocking = await prisma.blocking.findUnique({
      where: {
        blockeeId_blockerId: {
          blockerId: me.id,
          blockeeId: blockee.id,
        },
      },
    });
    assert(blocking === null);
  });

  test("与えられた ID のユーザーが存在しないときは 400 を返す", async () => {
    const agent = await getLoggedInAgent(app);

    const notExistingAccountId = 0;
    const response = await agent
      .post("/blockings/unblock")
      .type("form")
      .send({ blockeeId: notExistingAccountId });
    expect(response.statusCode).toEqual(400);
    expect(response.body).toEqual({
      message: "blockee with the given id is not found",
    });
  });

  test("与えられた ID が不正な形式の場合は 400 を返す", async () => {
    const agent = await getLoggedInAgent(app);

    const invalidAccountId = "a";
    const request = await agent
      .post("/blockings/unblock")
      .type("form")
      .send({ blockeeId: invalidAccountId });
    expect(request.statusCode).toEqual(400);
    expect(request.body).toEqual({ message: "blockeeId is not an integer" });
  });

  test("ブロックしていないユーザーをブロック解除しようとしたときは 400 を返す", async () => {
    const agent = await getLoggedInAgent(app);
    const blockee = await accountFactory.create();

    const response = await agent
      .post("/blockings/unblock")
      .type("form")
      .send({ blockeeId: blockee.id });
    expect(response.statusCode).toEqual(400);
    expect(response.body).toEqual({ message: "not blocked" });
  });
});
