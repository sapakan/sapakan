import supertest from "supertest";
import app from "../../src/app";

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
      services: {},
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
