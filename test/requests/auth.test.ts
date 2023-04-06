import supertest from "supertest";
import { Account } from "@prisma/client";
import { accountFactory, userFactory } from "../lib/factories";
import app from "../../src/app";
import { generateHash } from "../../src/lib/auth";

describe("POST /auth/signup", () => {
  test("username が与えられていない場合は 400 を返す", async () => {
    const response = await supertest.agent(app).post("/auth/signup");

    expect(response.statusCode).toEqual(400);
    expect(response.body).toEqual({
      message: "username and password are required",
    });
  });

  describe("不正な username が与えられた場合は 400 を返す", () => {
    test.each(["1234", "@aBc01"])(
      "username が %s のとき",
      async (invalidUsername) => {
        const response = await supertest
          .agent(app)
          .post("/auth/signup")
          .type("form")
          .send({
            username: invalidUsername,
            password: "password",
          });

        expect(response.statusCode).toEqual(400);
        expect(response.body).toEqual({
          message:
            "username must begin with [a-zA-Z], and can only use [a-zA-Z0-9].",
        });
      }
    );
  });

  test("正当な username が与えられたときには Account を作成し、それを返す", async () => {
    const username = "postapiaccounts";
    const response = await supertest
      .agent(app)
      .post("/auth/signup")
      .type("form")
      .send({
        username: username,
        password: "password",
      });

    expect(response.statusCode).toEqual(201);

    const resAccount: Account = response.body;
    expect(resAccount).toEqual(expect.objectContaining({ username: username }));
  });

  test("重複する username が与えられた場合は 400 を返す", async () => {
    const account = await accountFactory.create();

    const response = await supertest
      .agent(app)
      .post("/auth/signup")
      .type("form")
      .send({
        username: account.username,
        password: "password",
      });

    expect(response.statusCode).toEqual(400);
    expect(response.body).toEqual({
      message: `The username "${account.username}" is already taken by another user.`,
    });
  });
});
describe("POST /auth/signin", () => {
  test("存在しないl username が与えられた場合は 400 を返す", async () => {
    const response = await supertest
      .agent(app)
      .post("/auth/signin")
      .type("form")
      .send({
        username: "thisaccountdoesnotexist",
      });

    expect(response.statusCode).toEqual(400);
  });

  test("間違ったパスワードが与えられた場合は 401 を返す", async () => {
    const account = await accountFactory.create();

    const response = await supertest
      .agent(app)
      .post("/auth/signin")
      .type("form")
      .send({
        username: account.username,
        password: "wrongpassword",
      });

    expect(response.statusCode).toEqual(401);
  });

  test("正しい認証情報が与えられたとき", async () => {
    const password = "password1234";
    const user = await userFactory.create({
      hashedPassword: await generateHash(password),
    });
    const account = await accountFactory.create({ userId: user.id });
    const response = await supertest
      .agent(app)
      .post("/auth/signin")
      .type("form")
      .send({
        username: account.username,
        password: password,
      });

    expect(response.statusCode).toEqual(302);
  });
});

describe("POST /auth/signout", () => {
  test("ログアウトしたら 204 を返す", async () => {
    // given
    const password = "password123";
    const user = await userFactory.create({
      hashedPassword: await generateHash(password),
    });
    const account = await accountFactory.create({
      userId: user.id,
    });

    const agent = supertest.agent(app);
    agent.post("/auth/signin").type("form").send({
      username: account.username,
      password: password,
    });

    // when
    const response = await supertest.agent(app).post("/auth/signout");

    // then
    expect(response.statusCode).toEqual(204);
  });
});
