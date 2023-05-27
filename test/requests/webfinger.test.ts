import app from "../../src/app";
import supertest from "supertest";
import { config } from "../../src/config";
import { accountFactory } from "../lib/factories";

describe("GET /.well-known/webfinger", () => {
  describe("resource パラメータ文字列が不正", () => {
    test("resource パラメータが存在しない場合は 400 レスポンスを返す", async () => {
      const response = await supertest(app).get(`/.well-known/webfinger`);

      expect(response.statusCode).toEqual(400);
      expect(response.text).toStrictEqual("");
    });

    test("acct: から始まっていない場合は 400 を返す", async () => {
      const response = await supertest(app).get(
        `/.well-known/webfinger?resource=user@example.com`
      );

      expect(response.statusCode).toEqual(400);
      expect(response.text).toStrictEqual("");
    });

    test("acct:user のように @ を含めたホスト名が含まれていない場合は 400 を返す", async () => {
      const response = await supertest(app).get(
        `/.well-known/webfinger?resource=acct:user`
      );

      expect(response.statusCode).toEqual(400);
      expect(response.text).toStrictEqual("");
    });
  });

  test("ホスト部が自身のものと異なる場合は 404 を返す", async () => {
    const response = await supertest(app).get(
      `/.well-known/webfinger?resource=acct:user@example.com`
    );

    expect(response.statusCode).toEqual(404);
    expect(response.text).toStrictEqual("");
  });

  test("ユーザーが存在しない場合は 404 を返す", async () => {
    const configHost = config.url.replace(/https?:\/\//, "");
    const response = await supertest(app).get(
      `/.well-known/webfinger?resource=acct:not-exists@${configHost}`
    );

    expect(response.statusCode).toEqual(404);
    expect(response.text).toStrictEqual("");
  });

  test("指定したユーザーに関する情報を取得できる", async () => {
    const account = await accountFactory.create();

    const configHost = config.url.replace(/https?:\/\//, "");
    const response = await supertest(app).get(
      `/.well-known/webfinger?resource=acct:${account.username}@${configHost}`
    );

    expect(response.statusCode).toEqual(200);

    // 本来は charset が指定されていない content-type を期待する
    // https://datatracker.ietf.org/doc/html/rfc7033#section-10.2
    // しかし Express は自動で charset を追加してしまうので、一旦無視する
    // https://github.com/sapakan/sapakan/pull/86#discussion_r1195040930
    // expect(response.headers["content-type"]).toEqual(
    //   `application/jrd+json`
    // );
    expect(response.headers["content-type"]).toEqual(
      `application/jrd+json; charset=utf-8`
    );
    expect(response.body).toStrictEqual({
      subject: `acct:${account.username}@${configHost}`,
      links: [
        {
          rel: "self",
          type: "application/activity+json",
          href: `${config.url}/accounts/${account.username}`,
        },
        {
          rel: "http://webfinger.net/rel/profile-page",
          type: "text/html",
          href: `${config.url}/accounts/${account.username}`,
        },
      ],
    });
  });
});
