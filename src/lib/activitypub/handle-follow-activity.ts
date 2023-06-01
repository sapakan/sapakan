import { AcceptActivity, FollowActivity } from "../../@types/activitystreams";
import { Account } from "@prisma/client";
import { findOrCreateAccountWithApid } from "../../services/find-or-create-account-with-apid";
import { createFollowing } from "../../services/create-following";
import { deliver } from "../../services/deliver";
import { randomUuidWithoutHyphen } from "../random-uuid-without-hyphen";

/**
 * 与えられた activity に基づいてリモートインスタンス上のアカウントが account をフォローする関係を作成します。
 * また、リモートインスタンス上のアカウントに対して AcceptActivity を配送します。
 */
export async function handleFollowActivity(
  activity: FollowActivity,
  account: Account
) {
  const remoteAccount = await findOrCreateAccountWithApid(activity.actor);
  await createFollowing(remoteAccount.id, account.id);

  const acceptActivity: AcceptActivity = {
    "@context": "https://www.w3.org/ns/activitystreams",
    // 少なくとも Pleroma は以下の ID を利用したアンフォローのリクエストは飛ばさないため、適当な ID を生成して利用
    id: `${account.apid}/activities/accept-following-${account.username}-by-${
      remoteAccount.username
    }-${remoteAccount.host}-${randomUuidWithoutHyphen()}`,
    type: "Accept",
    actor: account.apid,
    object: activity,
  };

  await deliver(acceptActivity, account, remoteAccount.inboxUrl);
}
