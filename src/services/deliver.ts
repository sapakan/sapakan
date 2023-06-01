import { Activity } from "../@types/activitystreams";
import { Account } from "@prisma/client";
import { signHttpRequestWithAccount } from "./sign-http-request";

/**
 * 与えられた Activity を account の鍵による署名と共に配送します。
 */
export async function deliver(
  activity: Activity,
  account: Account,
  inboxUrl: string
): Promise<Response> {
  const inboxPath = new URL(inboxUrl).pathname;
  const date = new Date();
  const headers = await signHttpRequestWithAccount(
    account.username,
    "POST",
    inboxPath,
    date,
    {
      accept: "application/activity+json",
      "Content-Type": "application/activity+json",
      Date: date.toUTCString(),
    }
  );

  console.log(`delivering ${JSON.stringify(activity)} to ${inboxUrl}`);

  return fetch(inboxUrl, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(activity),
  });
}
