import bodyParser from "body-parser";
import express from "express";
import session from "express-session";
import * as homeController from "./controllers/home";
import * as postsController from "./controllers/posts";
import * as accountsController from "./controllers/accounts";
import * as authController from "./controllers/auth";
import * as followingsController from "./controllers/followings";
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
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", homeController.index);
app.post("/posts", ensureLoggedIn, postsController.postPosts);
app.get("/posts/:id", postsController.getPost);
app.get("/posts/:id/likes", postsController.getPostLikes);
app.post("/posts/:id/likes", ensureLoggedIn, postsController.postPostLikes);
app.delete("/posts/:id/likes", ensureLoggedIn, postsController.deletePostLikes);
app.get("/accounts/:id", accountsController.getAccount);
app.get("/accounts/:id/posts", accountsController.getAccountPosts);
app.get("/accounts/:id/likes", accountsController.getAccountLikes);
app.post("/followings", ensureLoggedIn, followingsController.postFollowings);
app.delete(
  "/followings",
  ensureLoggedIn,
  followingsController.deleteFollowings
);

export default app;
