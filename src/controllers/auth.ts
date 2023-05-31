import { NextFunction, Request, Response, Router } from "express";
import passport from "passport";
import { Strategy } from "passport-local";
import { createKeyPair, generateHash, verifyPassword } from "../lib/auth";
import prisma from "../lib/prisma";

export const router = Router();

passport.use(
  "local",
  new Strategy(async (username, password, done) => {
    const incorrectCredentialMessage = "Incorrect username or password.";

    const user = await prisma.user.findFirst({
      where: {
        account: {
          username: username,
        },
      },
    });
    if (user === null) {
      return done(null, false, { message: incorrectCredentialMessage });
    }
    if (await verifyPassword(user.hashedPassword, password)) {
      const account = await prisma.account.findUniqueOrThrow({
        where: {
          userId: user.id,
        },
      });
      return done(null, { accountId: account.id, username: account.username });
    } else {
      return done(null, false, { message: incorrectCredentialMessage });
    }
  })
);

// セッションでユーザー情報を保持するための serialization 方法を指定
passport.serializeUser((user, done) => {
  done(null, { id: user.accountId, username: user.username });
});

// セッションで保持されているユーザー情報から `req.user` に deserialize するための方法を指定
passport.deserializeUser((user, done) => {
  if (
    typeof user === "object" &&
    user !== null &&
    "id" in user &&
    "username" in user
  ) {
    const id = user.id;
    const username = user.username;
    if (typeof id === "number" && typeof username === "string") {
      return done(null, { accountId: id, username });
    }
  }
});

/**
 * POST /auth/signup
 */
const postAuthSignup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { username, password } = req.body;
  if (username === undefined || password === undefined) {
    return res
      .status(400)
      .json({ message: "username and password are required" });
  }
  if (!username.match(/^[a-zA-Z][0-9a-zA-Z]*$/)) {
    return res.status(400).json({
      message:
        "username must begin with [a-zA-Z], and can only use [a-zA-Z0-9].",
    });
  }
  if (await accountWithUsernameExists(username)) {
    // 409 Conflict を返すのが適切かもしれないが、とりあえず 400 を返しておくこととする
    // https://stackoverflow.com/questions/3825990/http-response-code-for-post-when-resource-already-exists
    return res.status(400).json({
      message: `The username "${username}" is already taken by another user.`,
    });
  }

  const createdUser = await prisma.user.create({
    data: {
      hashedPassword: await generateHash(password),
    },
  });

  const [publicKey, privateKey] = await createKeyPair();

  const createdAccount = await prisma.account.create({
    data: {
      username,
      userId: createdUser.id,
      host: "localhost",
      publicKey: publicKey,
      privateKey: privateKey,
    },
    select: {
      id: true,
      username: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  req.login(
    { accountId: createdAccount.id, username: createdAccount.username },
    (err) => {
      if (err) {
        return next(err);
      }
      return res.status(201).json(createdAccount);
    }
  );
};

router
  .post("/auth/signup", postAuthSignup)
  .post(
    "/auth/signin",
    passport.authenticate("local", {
      // TODO: 自分のアカウントの情報を取得できるエンドポイントを用意し、そこにリダイレクトさせる
      successRedirect: "/",
    })
  )
  .post("/auth/signout", (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
    });
    res.status(204).end();
  });

/**
 * 与えられた Username を持つアカウントが存在するならば true を、そうでなければ false を返します。
 */
async function accountWithUsernameExists(username: string): Promise<boolean> {
  const count = await prisma.account.count({ where: { username } });
  return count > 0;
}
