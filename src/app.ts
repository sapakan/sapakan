import bodyParser from "body-parser";
import express from "express";
import session from "express-session";
import * as homeController from "./controllers/home";
import * as postsController from "./controllers/posts";
import * as accountsController from "./controllers/accounts";
import * as authController from "./controllers/auth";
import * as followingsController from "./controllers/followings";
import * as timelineController from "./controllers/timeline";
import * as blockingsController from "./controllers/blockings";
import * as nodeInfoController from "./controllers/nodeinfo";
import * as webFingerController from "./controllers/webfinger";
import passport from "passport";
import { ensureLoggedIn } from "./lib/middlewares";

const app = express()
  .use(
    session({
      secret: process.env.EXPRESS_SESSION_SECRET ?? "test",
      // 変更が加わっていないセッションを再度保存しない
      resave: false,
      // 初期化されていないセッションを保存しない
      saveUninitialized: false,
    })
  )
  // passport による認証を有効化
  .use(passport.authenticate("session"))
  // `Content-Type: application/x-www-form-urlencoded` なリクエストで渡されるデータを解釈する
  .use(express.urlencoded({ extended: true }))
  // 認証関連のエンドポイントを有効化
  .use(authController.router);

app.set("port", process.env.PORT || 3000);
app.use(bodyParser.json());
app.use(
  bodyParser.json({
    type: "application/activity+json",
  })
);
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", homeController.index);

// .well-known
app.get("/.well-known/nodeinfo", nodeInfoController.getWellKnownNodeInfo);
app.get("/.well-known/webfinger", webFingerController.getWellKnownWebFinger);

app.post("/posts", ensureLoggedIn, postsController.postPosts);
app.get("/posts/:id", postsController.getPost);
app.get("/posts/:id/likes", postsController.getPostLikes);
app.post("/posts/:id/likes", ensureLoggedIn, postsController.postPostLikes);
app.delete("/posts/:id/likes", ensureLoggedIn, postsController.deletePostLikes);
app.get("/accounts/:username", accountsController.getAccount);
app.get("/accounts/:username/posts", accountsController.getAccountPosts);
app.get("/accounts/:username/likes", accountsController.getAccountLikes);
app.get(
  "/accounts/:username/followees",
  accountsController.getAccountFollowees
);
app.get(
  "/accounts/:username/followers",
  accountsController.getAccountFollowers
);
app.post("/accounts/:username/inbox", accountsController.postAccountInbox);
app.post(
  "/followings/follow",
  ensureLoggedIn,
  followingsController.postFollowingsFollow
);
app.post(
  "/followings/unfollow",
  ensureLoggedIn,
  followingsController.postFollowingsUnfollow
);
app.get("/timeline", ensureLoggedIn, timelineController.getTimeline);
app.post(
  "/blockings/block",
  ensureLoggedIn,
  blockingsController.postBlockingsBlock
);
app.post(
  "/blockings/unblock",
  ensureLoggedIn,
  blockingsController.postBlockingsUnblock
);
app.get("/nodeinfo/2.1", nodeInfoController.getNodeInfoSchema2_1);

export default app;
