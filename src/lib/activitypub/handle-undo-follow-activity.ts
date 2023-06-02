import {
  Activity,
  FollowActivity,
  UndoActivity,
} from "../../@types/activitystreams";
import { Account } from "@prisma/client";
import { findOrCreateAccountWithApid } from "../../services/find-or-create-account-with-apid";
import { deleteFollowing } from "../../services/create-following";

/**
 * 与えられた activity に基づいてリモートインスタンス上のアカウントが account をフォローする関係を削除します。
 */
export async function handleUndoFollowActivity(
  activity: UndoActivity,
  account: Account
) {
  assertFollowingActivity(activity.object);

  const remoteAccount = await findOrCreateAccountWithApid(activity.actor);
  await deleteFollowing(account.id, remoteAccount.id);
}

function assertFollowingActivity(
  activity: Activity
): asserts activity is FollowActivity {
  if (activity.type !== "Follow") {
    throw new Error("activity must be FollowActivity");
  }
}
