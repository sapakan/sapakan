import { Response, Request } from "express";
import { config } from "../config";
import prisma from "../lib/prisma";

/**
 * GET /.well-known/webfinger
 */
export const getWellKnownWebFinger = async (req: Request, res: Response) => {
  // https://datatracker.ietf.org/doc/html/rfc7033#section-4.4
  type response = {
    // https://datatracker.ietf.org/doc/html/rfc7033#section-4.4.1
    subject: string;

    // https://datatracker.ietf.org/doc/html/rfc7033#section-4.4.2
    aliases?: string[];

    // https://datatracker.ietf.org/doc/html/rfc7033#section-4.4.3
    properties?: {
      [key: string]: string;
    };

    // https://datatracker.ietf.org/doc/html/rfc7033#section-4.4.4
    links?: {
      rel: string;
      type?: string;
      href?: string;
      titles?: {
        [key: string]: string;
      };
      properties?: {
        [key: string]: string;
      };
    }[];
  };

  const resource = req.query.resource;

  // URL クエリパラメータ "resource" が存在していなければ 400 を返す
  // > If the "resource" parameter is absent or malformed, the WebFinger
  // > resource MUST indicate that the request is bad as per Section 10.4.1
  // > of RFC 2616 [2].
  // https://datatracker.ietf.org/doc/html/rfc7033#section-4.2
  if (resource === undefined) {
    res.status(400).end();
    return;
  }

  // resource が acct:username@host 形式でなければ 400 を返す
  if (
    !(
      typeof resource == "string" &&
      resource.startsWith("acct:") &&
      resource.includes("@")
    )
  ) {
    res.status(400).end();
    return;
  }

  const resourceSplit = resource.replace("acct:", "").split("@");
  if (resourceSplit.length !== 2) {
    res.status(400).end();
    return;
  }

  const [username, host] = resourceSplit;

  // resource の host が config.url で設定されているものと一致しなければ 404 を返す
  // > If the "resource" parameter is a value for which the server has no
  // > information, the server MUST indicate that it was unable to match the
  // > request as per Section 10.4.5 of RFC 2616.
  // https://datatracker.ietf.org/doc/html/rfc7033#section-4.2
  // Section 10.4.5 of RFC 2616 は 404 Not Found を指している
  const configHost = config.url.replace(/https?:\/\//, "");
  if (host !== configHost) {
    res.status(404).end();
    return;
  }

  const account = await prisma.account.findUnique({
    where: {
      username_host: {
        username,
        host: "localhost",
      },
    },
  });
  if (account === null) {
    res.status(404).end();
    return;
  }

  const resBody: response = {
    subject: resource,
    links: [
      {
        rel: "self",
        type: "application/activity+json",
        href: `${config.url}/accounts/${username}`,
      },
      {
        rel: "http://webfinger.net/rel/profile-page",
        type: "text/html",
        href: `${config.url}/accounts/${username}`,
      },
    ],
  };

  res.status(200).type("application/jrd+json").json(resBody);
};
