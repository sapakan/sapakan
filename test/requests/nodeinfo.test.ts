import supertest from "supertest";
import app from "../../src/app";
import { config } from "../../src/config";

describe("GET /.well-known/nodeinfo", () => {
  test("NodeInfo エンドポイントの一覧を取得する", async () => {
    const response = await supertest(app).get("/.well-known/nodeinfo");

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      links: [
        {
          rel: "http://nodeinfo.diaspora.software/ns/schema/2.1",
          href: `${config.url}/nodeinfo/2.1`,
        },
      ],
    });
  });
});

describe("GET /nodeinfo/2.1", () => {
  test("NodeInfo protocol 2.1 に従う内容を取得する", async () => {
    // アクセスする側は HTTP リクエストの Accept ヘッダーに application/json を指定するべき（SHOULD）
    // なお、あくまでも SHOULD なので、実装としてはそれに従わないリクエストも受け入れるようにしている
    // > When accessing the referenced schema document, a client should set the Accept header to the application/json media type.
    // https://nodeinfo.diaspora.software/protocol.html
    const response = await supertest(app)
      .get("/nodeinfo/2.1")
      .set("accept", "application/json");

    expect(response.statusCode).toEqual(200);
    // 本来はこのように charset なしで返すべき
    // expect(response.headers["content-type"]).toEqual(`application/json; profile="http://nodeinfo.diaspora.software/ns/schema/2.1#"`);
    // Express 側の都合で charset が自動で追加されてしまい、また追加されないようにできなかったので暫定的に charset ありでチェックする
    expect(response.headers["content-type"]).toEqual(
      `application/json; charset=utf-8; profile="http://nodeinfo.diaspora.software/ns/schema/2.1#"`
    );
    expect(response.body).toEqual({
      version: "2.1",
      software: {
        name: expect.any(String),
        version: expect.any(String),
      },
      protocols: ["activitypub"],
      services: {
        inbound: [],
        outbound: [],
      },
      openRegistrations: true,
      usage: {
        users: {
          total: expect.any(Number),
        },
        localPosts: expect.any(Number),
      },
      metadata: {},
    });
  });

  test("リクエストの accept ヘッダーが正しく指定されていなくても内容を取得できる", async () => {
    // リクエストの accept: application/json は SHOULD である
    // これを付けないリクエストも想定し、正しく内容を取得できることを確認しておく
    const response = await supertest(app).get("/nodeinfo/2.1");

    expect(response.statusCode).toEqual(200);
    expect(response.headers["content-type"]).toEqual(
      `application/json; charset=utf-8; profile="http://nodeinfo.diaspora.software/ns/schema/2.1#"`
    );
    expect(response.body).toEqual({
      version: "2.1",
      software: {
        name: expect.any(String),
        version: expect.any(String),
      },
      protocols: ["activitypub"],
      services: {
        inbound: [],
        outbound: [],
      },
      openRegistrations: true,
      usage: {
        users: {
          total: expect.any(Number),
        },
        localPosts: expect.any(Number),
      },
      metadata: {},
    });
  });
});
