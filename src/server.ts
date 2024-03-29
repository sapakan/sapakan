import app from "./app";

const server = app.listen(app.get("port"), () => {
  console.log(
    "Listening on http://localhost:%d in %s mode",
    app.get("port"),
    app.get("env")
  );
});

export default server;
