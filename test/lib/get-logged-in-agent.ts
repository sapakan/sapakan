import supertest, { SuperAgentTest } from "supertest";
import { Account } from "@prisma/client";
import { Express } from "express";
import { accountFactory } from "./factories";

/**
 * ログインした状態の agent を返します。
 */
export async function getLoggedInAgent(
  app: Express,
  options?: {
    account: Account;
    password: string;
  }
) {
  const loginAccount =
    options !== undefined ? options.account : await accountFactory.create();
  const loginPassword = options !== undefined ? options.password : "password";

  const agent = supertest.agent(app);

  const loginResponse = await agent
    .post("/auth/signin")
    .send({ username: loginAccount.username, password: loginPassword })
    .type("form");

  if (loginResponse.status !== 302) {
    throw new Error("Failed to login");
  }
  return agent;
}

/**
 * ログインした状態の agent とログイン中の Account を返します。
 */
export async function getLoggedInAgentAndAccount(
  app: Express
): Promise<[SuperAgentTest, Account]> {
  const loginAccount = await accountFactory.create();
  const loginPassword = "password";

  const agent = await getLoggedInAgent(app, {
    account: loginAccount,
    password: loginPassword,
  });
  return [agent, loginAccount];
}
