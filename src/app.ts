import bodyParser from "body-parser";
import express from "express";

import * as homeController from "./controllers/home";

const app = express();

app.set("port", process.env.PORT || 3000);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", homeController.index);

export default app;
