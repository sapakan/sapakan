import { getLoggedInAgentAndAccount } from "../lib/get-logged-in-agent";
import app from "../../src/app";
import { followingFactory } from "../lib/factories";
import { postFactory, likeFactory } from "../lib/factories";
import supertest from "supertest";

describe("GET /timeline", () => {
  test("自身がフォローしているアカウントの post を取得する", async () => {
    const [agent, me] = await getLoggedInAgentAndAccount(app);

    // 自身がフォローしているアカウントによる投稿を作成する
    const followingAccount = await followingFactory.create({
      followerId: me.id,
    });
    const postsByfollowingAccount = await postFactory.createList(2, {
      authorId: followingAccount.followeeId,
    });

    // 0 番目の投稿だけ自身が like している
    await likeFactory.create({
      postId: postsByfollowingAccount[0].id,
      likedById: me.id,
    });

    // 自身がフォロー **していない** アカウントによる投稿を作成する
    const postsByNotfollowingAccount = await postFactory.createList(2);

    const response = await agent.get("/timeline");
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        // TODO: 新しいのが一番最初に来るように並べ替えられていることを確認する

        // expect.objectContaining({
        //   id: postsByfollowingAccount[0].id,
        // }),
        expect.objectContaining({
          id: postsByfollowingAccount[1].id,
          likedByMe: false,
        }),
        expect.objectContaining({
          id: postsByfollowingAccount[0].id,
          likedByMe: true,
        }),
      ])
    );
    expect(response.body).toEqual(
      expect.not.arrayContaining([
        expect.objectContaining({
          id: postsByNotfollowingAccount[0].id,
        }),
        expect.objectContaining({
          id: postsByNotfollowingAccount[1].id,
        }),
      ])
    );
  });

  test("ログインしていない場合は 302 を返す", async () => {
    const response = await supertest(app).get(`/timeline`);

    expect(response.statusCode).toEqual(302);
  });
});
