import { listRemoteFollowerAccounts } from "../../src/lib/follower";
import { createExternalAccount } from "../../src/services/create-account";
import { createLocalAccount } from "../../src/services/create-account";
import {
  accountFactory,
  externalAccountFactory,
  followingFactory,
} from "../lib/factories";

describe(listRemoteFollowerAccounts, () => {
  test("自身のフォロワーで、かつリモートのアカウント一覧を取得できる", async () => {
    const me = await accountFactory.create();
    const followerLocal = await accountFactory.create();
    const followerRemote = await externalAccountFactory.create();

    await followingFactory.create({
      followeeId: me.id,
      followerId: followerLocal.id,
    });
    await followingFactory.create({
      followeeId: me.id,
      followerId: followerRemote.id,
    });

    const remoteFollowers = await listRemoteFollowerAccounts(me.id);

    expect(remoteFollowers.length).toEqual(1);

    expect(remoteFollowers).toStrictEqual([
      expect.objectContaining({
        id: followerRemote.id,
      }),
    ]);

    expect(remoteFollowers).toStrictEqual(
      expect.not.objectContaining({
        id: followerLocal.id,
      })
    );
  });
});
