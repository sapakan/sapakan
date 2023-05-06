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

describe("POST /followings/follow", () => {
  test("ログインしていないときは 302 を返す", async () => {
    const response = await supertest.agent(app).post("/followings/follow");
    expect(response.statusCode).toEqual(302);
  });

  test("与えられた ID のユーザーをフォローできる", async () => {
    const [agent, account] = await getLoggedInAgentAndAccount(app);
    const followee = await accountFactory.create();

    const response = await agent
      .post("/followings/follow")
      .type("form")
      .send({ followeeId: followee.id });

    expect(response.statusCode).toEqual(201);
    const following = await prisma.following.findUnique({
      where: {
        followeeId_followerId: {
          followerId: account.id,
          followeeId: followee.id,
        },
      },
    });
    assert(following !== null);
    expect(following.followerId).toEqual(account.id);
    expect(following.followeeId).toEqual(followee.id);
  });

  test("フォローしたユーザーのフォロワー数が 1 増える", async () => {
    const [agent, account] = await getLoggedInAgentAndAccount(app);
    const followee = await accountFactory.create();

    await agent
      .post("/followings/follow")
      .type("form")
      .send({ followeeId: followee.id });
    const updatedFollower = await prisma.account.findUnique({
      where: { id: account.id },
    });
    assert(updatedFollower !== null);
    expect(updatedFollower.followeeCount).toEqual(1);
  });

  test("フォローされたユーザーのフォロワー数が 1 増える", async () => {
    const agent = await getLoggedInAgent(app);
    const followee = await accountFactory.create();

    await agent
      .post("/followings/follow")
      .type("form")
      .send({ followeeId: followee.id });
    const updatedFollowee = await prisma.account.findUnique({
      where: { id: followee.id },
    });
    assert(updatedFollowee !== null);
    expect(updatedFollowee.followerCount).toEqual(1);
  });

  test("与えられた ID のユーザーが存在しないときは 400 を返す", async () => {
    const [agent, account] = await getLoggedInAgentAndAccount(app);

    const response = await agent
      .post("/followings/follow")
      .type("form")
      .send({ followeeId: 0 });
    expect(response.statusCode).toEqual(400);
    expect(response.body).toEqual({
      message: "followee with the given id is not found",
    });
  });

  test("与えられた ID が不正な形式の場合は 400 を返す", async () => {
    const agent = await getLoggedInAgent(app);

    const request = await agent
      .post("/followings/follow")
      .type("form")
      .send({ followeeId: "a" });
    expect(request.statusCode).toEqual(400);
    expect(request.body).toEqual({ message: "followeeId is not an integer" });
  });

  test("与えられた ID のユーザーが自分自身のときは 400 を返す", async () => {
    const [agent, account] = await getLoggedInAgentAndAccount(app);

    const response = await agent
      .post("/followings/follow")
      .type("form")
      .send({ followeeId: account.id });
    expect(response.statusCode).toEqual(400);
    expect(response.body).toEqual({ message: "cannot follow yourself" });
  });

  test("既にフォローしているユーザーをフォローしようとしたときは 400 を返す", async () => {
    const [agent, account] = await getLoggedInAgentAndAccount(app);
    const followee = await accountFactory.create();
    await followingFactory.create({
      followerId: account.id,
      followeeId: followee.id,
    });

    const response = await agent
      .post("/followings/follow")
      .type("form")
      .send({ followeeId: followee.id });
    expect(response.statusCode).toEqual(400);
    expect(response.body).toEqual({ message: "already followed" });
  });

  test("ブロックされているユーザーをフォローしようとしたときは 403 を返す", async () => {
    const [agent, account] = await getLoggedInAgentAndAccount(app);
    const followee = await accountFactory.create();
    await blockingFactory.create({
      blockeeId: account.id,
      blockerId: followee.id,
    });

    const response = await agent
      .post("/followings/follow")
      .type("form")
      .send({ followeeId: followee.id });
    expect(response.statusCode).toEqual(403);
    expect(response.body).toEqual({ message: "already blocked" });
  });
});

describe("POST /followings/unfollow", () => {
  test("ログインしていないときは 302 を返す", async () => {
    const response = await supertest.agent(app).post("/followings/unfollow");
    expect(response.statusCode).toEqual(302);
  });

  test("与えられた ID のユーザーのフォローを解除できる", async () => {
    const [agent, account] = await getLoggedInAgentAndAccount(app);
    const followee = await accountFactory.create();
    await followingFactory.create({
      followerId: account.id,
      followeeId: followee.id,
    });

    const response = await agent
      .post("/followings/unfollow")
      .type("form")
      .send({ followeeId: followee.id });

    expect(response.statusCode).toEqual(200);
    const following = await prisma.following.findUnique({
      where: {
        followeeId_followerId: {
          followerId: account.id,
          followeeId: followee.id,
        },
      },
    });
    assert(following === null);
  });

  test("フォローしたユーザーのフォロワー数が 1 減る", async () => {
    const [agent, account] = await getLoggedInAgentAndAccount(app);
    const followee = await accountFactory.create();
    await followingFactory.create({
      followerId: account.id,
    });
    await followingFactory.create({
      followerId: account.id,
      followeeId: followee.id,
    });

    await agent
      .post("/followings/unfollow")
      .type("form")
      .send({ followeeId: followee.id });

    const updatedFollower = await prisma.account.findUnique({
      where: { id: account.id },
    });
    assert(updatedFollower !== null);
    expect(updatedFollower.followeeCount).toEqual(1);
  });

  test("フォローされたユーザーのフォロワー数が 1 減る", async () => {
    const [agent, account] = await getLoggedInAgentAndAccount(app);
    const followee = await accountFactory.create();
    await followingFactory.create({
      followeeId: followee.id,
    });
    await followingFactory.create({
      followerId: account.id,
      followeeId: followee.id,
    });

    await agent
      .post("/followings/unfollow")
      .type("form")
      .send({ followeeId: followee.id });

    const updatedFollowee = await prisma.account.findUnique({
      where: { id: followee.id },
    });
    assert(updatedFollowee !== null);
    expect(updatedFollowee.followerCount).toEqual(1);
  });

  test("与えられた ID ユーザーが存在しないときは 400 を返す", async () => {
    const agent = await getLoggedInAgent(app);

    const response = await agent
      .post("/followings/unfollow")
      .type("form")
      .send({ followeeId: 0 });
    expect(response.statusCode).toEqual(400);
    expect(response.body).toEqual({
      message: "followee with the given id is not found",
    });
  });

  test("与えられた ID が不正な形式の場合は 400 を返す", async () => {
    const agent = await getLoggedInAgent(app);

    const request = await agent
      .post("/followings/unfollow")
      .type("form")
      .send({ followeeId: "a" });
    expect(request.statusCode).toEqual(400);
    expect(request.body).toEqual({ message: "followeeId is not an integer" });
  });

  test("フォローしていないユーザーをフォロー解除しようとしたときは 400 を返す", async () => {
    const agent = await getLoggedInAgent(app);
    const followee = await accountFactory.create();

    const response = await agent
      .post("/followings/unfollow")
      .type("form")
      .send({ followeeId: followee.id });
    expect(response.statusCode).toEqual(400);
    expect(response.body).toEqual({ message: "not followed" });
  });
});
