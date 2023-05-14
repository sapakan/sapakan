import { Response, Request } from "express";
import prisma from "../lib/prisma";
import { config } from "../config";

/**
 * GET /.well-known/nodeinfo
 * https://nodeinfo.diaspora.software/protocol.html
 */
export const getWellKnownNodeInfo = async (req: Request, res: Response) => {
  // https://nodeinfo.diaspora.software/protocol.html の Example
  type WellKnownNodeInfo = {
    links: [
      {
        rel: string;
        href: string;
      }
    ];
  };

  const wellKnownNodeInfo: WellKnownNodeInfo = {
    links: [
      {
        rel: "http://nodeinfo.diaspora.software/ns/schema/2.1",
        href: `${config.url}/nodeinfo/2.1`,
      },
      // Schema 2.1 の /nodeinfo/2.1 以外に /nodeinfo/2.0 なども用意している場合はここに追加する
    ],
  };

  res.status(200).json(wellKnownNodeInfo);
};

/**
 * GET /nodeinfo/2.1
 * NodeInfo protocol 2.1 に従う
 * https://nodeinfo.diaspora.software/protocol.html
 */
export const getNodeInfoSchema2_1 = async (req: Request, res: Response) => {
  // https://nodeinfo.diaspora.software/docson/index.html#/ns/schema/2.1#$$expand
  // 太字が必須で、そうでないものは任意だと思われる
  type NodeInfoSchema2_1 = {
    version: string;
    software: {
      // ソフトウェアの正規名
      name: string;
      // ソフトウェアのバージョン
      version: string;
      // ソフトウェアが格納されているリポジトリの URL
      repository?: string;
      // ソフトウェアのホームページの URL
      homepage?: string;
    };
    protocols: string[];
    // 子の key: value を持たない単純な 'services: {}' だけが欲しい
    services: Record<never, never>;
    openRegistrations: boolean;
    usage: {
      users: {
        total?: number;
        activeHalfyear?: number;
        activeMonth?: number;
      };
      localPosts?: number;
      localComments?: number;
    };
    // "ソフトウェア固有の": "自由形式のキーと値のペア"
    // sapakan では metadata は使わない
    metadata: Record<never, never>;
  };

  const accountTotal = await prisma.account.count();
  const localPosts = await prisma.post.count();

  const nodeInfo: NodeInfoSchema2_1 = {
    version: "2.1",
    software: {
      name: config.name,
      version: config.version,
    },
    protocols: ["activitypub"],
    services: {},
    openRegistrations: true,
    usage: {
      users: {
        total: accountTotal,
      },
      localPosts: localPosts,
    },
    metadata: {},
  };

  res
    .status(200)

    // NodeInfo を配信するサーバー側は HTTP レスポンスの Content-Type ヘッダーに以下のようなものを指定するべき（SHOULD）
    // > A server should set a Content-Type of application/json; profile="http://nodeinfo.diaspora.software/ns/schema/2.1#", where the value of profile matches the resolution scope of the NodeInfo schema version that’s being returned.
    // https://nodeinfo.diaspora.software/protocol.html

    // Content-Type の値に Express が自動で charset=utf-8 を追加してくる
    // charset をつけないように試してみたがうまくいかず
    // 参考：https://qiita.com/satosystems/items/a62c9a2f9c2712b5a1ea
    .header(
      "Content-Type",
      `application/json; profile="http://nodeinfo.diaspora.software/ns/schema/2.1#"`
    )
    .json(nodeInfo);
};
