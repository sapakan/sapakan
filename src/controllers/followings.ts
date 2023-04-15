import { Request, Response } from "express";
import parseIntOrUndefined from "../lib/parse-int-or-undefined";
import assert from "assert";
import prisma from "../lib/prisma";
import { createFollowing, deleteFollowing } from "../services/create-following";

export const postFollowingsFollow = async (req: Request, res: Response) => {
  const followeeId = parseIntOrUndefined(req.body.followeeId);
  if (req.body.followeeId === undefined) {
    return res.status(400).json({ message: "followeeId is required" });
  }
  if (followeeId === undefined) {
    return res.status(400).json({ message: "followeeId is not an integer" });
  }

  // 前段に ensureLoggedIn があるためここの followerId が undefined になることはない
  const followerId = req.user?.accountId;
  assert(followerId !== undefined);

  // 自分自身をフォローすることはできないようにする
  if (followeeId === followerId) {
    return res.status(400).json({ message: "cannot follow yourself" });
  }

  // 与えられた ID に対応するアカウントの存在確認
  const followee = await prisma.account.findUnique({
    where: { id: followeeId },
  });
  if (followee === null) {
    return res
      .status(400)
      .json({ message: "followee with the given id is not found" });
  }

  if (await userAlreadyFollowed(followeeId, followerId)) {
    return res.status(400).json({ message: "already followed" });
  }

  const following = await createFollowing(followeeId, followerId);
  res.status(201).json(following);
};

export const deleteFollowings = async (req: Request, res: Response) => {
  const followeeId = parseIntOrUndefined(req.body.followeeId);
  if (req.body.followeeId === undefined) {
    return res.status(400).json({ message: "followeeId is required" });
  }
  if (followeeId === undefined) {
    return res.status(400).json({ message: "followeeId is not an integer" });
  }

  // 前段に ensureLoggedIn があるためここの followerId が undefined になることはない
  const followerId = req.user?.accountId;
  assert(followerId !== undefined);

  // 与えられた ID に対応するアカウントの存在確認
  const followee = await prisma.account.findUnique({
    where: { id: followeeId },
  });
  if (followee === null) {
    return res
      .status(400)
      .json({ message: "followee with the given id is not found" });
  }

  if (!(await userAlreadyFollowed(followeeId, followerId))) {
    return res.status(400).json({ message: "not followed" });
  }

  const following = await deleteFollowing(followeeId, followerId);
  res.status(200).json(following);
};

/**
 * 与えられた followeeId と followerId に紐づく Following が存在するならば true を、そうでなければ false を返します。
 */
function userAlreadyFollowed(
  followeeId: number,
  followerId: number
): Promise<boolean> {
  return prisma.following
    .findUnique({
      where: {
        followeeId_followerId: {
          followeeId: followeeId,
          followerId: followerId,
        },
      },
    })
    .then((following) => following !== null);
}
