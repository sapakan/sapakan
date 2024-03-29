import { Request, Response } from "express";
import parseIntOrUndefined from "../lib/parse-int-or-undefined";
import prisma from "../lib/prisma";
import assert from "assert";
import { createBlocking, deleteBlocking } from "../services/create-blocking";

export const postBlockingsBlock = async (req: Request, res: Response) => {
  // blockeeId: 自身がブロックしたい対象 Account の ID
  const blockeeId = parseIntOrUndefined(req.body.blockeeId);
  if (req.body.blockeeId === undefined) {
    return res.status(400).json({ message: "blockeeId is required" });
  }
  if (blockeeId === undefined) {
    return res.status(400).json({ message: "blockeeId is not an integer" });
  }

  // 前段に ensureLoggedIn があるためここの blockerId が undefined になることはない
  const blockerId = req.user?.accountId;
  assert(blockerId !== undefined);

  // 自分自身をブロックできないようにする
  if (blockeeId === blockerId) {
    return res.status(400).json({ message: "cannot block yourself" });
  }

  // ブロック対象の ID に対応するアカウントの存在確認
  const target = await prisma.account.findUnique({
    where: { id: blockeeId },
  });

  if (target === null) {
    return res
      .status(400)
      .json({ message: "blockee with the given id is not found" });
  }

  if (await userAlreadyBlocked(blockeeId, blockerId)) {
    return res.status(400).json({ message: "already blocked" });
  }

  const blocking = await createBlocking(blockeeId, blockerId);
  res.status(201).json(blocking);
};

export const postBlockingsUnblock = async (req: Request, res: Response) => {
  // blockeeId: 自身がブロック解除したい対象 Account の ID
  const blockeeId = parseIntOrUndefined(req.body.blockeeId);
  if (req.body.blockeeId === undefined) {
    return res.status(400).json({ message: "blockeeId is required" });
  }
  if (blockeeId === undefined) {
    return res.status(400).json({ message: "blockeeId is not an integer" });
  }

  // 前段に ensureLoggedIn があるためここの blockerId が undefined になることはない
  const blockerId = req.user?.accountId;
  assert(blockerId !== undefined);

  // ブロック対象の ID に対応するアカウントの存在確認
  const target = await prisma.account.findUnique({
    where: { id: blockeeId },
  });

  if (target === null) {
    return res
      .status(400)
      .json({ message: "blockee with the given id is not found" });
  }

  if (!(await userAlreadyBlocked(blockeeId, blockerId))) {
    return res.status(400).json({ message: "not blocked" });
  }

  const blocking = await deleteBlocking(blockeeId, blockerId);
  res.status(201).json(blocking);
};

/**
 * 与えられた blockeeId と blockerId に紐づく Blocking が存在するならば true を、そうでなければ false を返します。
 */
export function userAlreadyBlocked(
  blockeeId: number,
  blockerId: number
): Promise<boolean> {
  return prisma.blocking
    .findUnique({
      where: {
        blockeeId_blockerId: {
          blockeeId: blockeeId,
          blockerId: blockerId,
        },
      },
    })
    .then((blocking) => blocking !== null);
}
