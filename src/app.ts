import bodyParser from "body-parser";
import express from "express";

import * as homeController from "./controllers/home";
import * as postsController from "./controllers/posts";
import * as accountsController from "./controllers/accounts";

const app = express();

app.set("port", process.env.PORT || 3000);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", homeController.index);
app.post("/posts", postsController.postPosts);
app.get("/posts/:id", postsController.getPost);
app.get("/posts/:id/likes", postsController.getPostLikes);
app.post("/posts/:id/likes", postsController.postPostLikes);
app.delete("/posts/:id/likes", postsController.deletePostLikes);
app.post("/accounts", accountsController.postAccounts);
app.get("/accounts/:id", accountsController.getAccount);
app.get("/accounts/:id/posts", accountsController.getAccountPosts);
app.get("/accounts/:id/likes", accountsController.getAccountLikes);

export default app;
