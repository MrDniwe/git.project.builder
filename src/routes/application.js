const path = require("path");
const multer = require("koa-multer");
const { dummy, build, application } = require("../controllers");
const Router = require("koa-router");
const auth = require("../libs/auth");
const route = new Router({
  prefix: "/api/applications"
});
const upload = multer({ dest: path.resolve(__dirname, "../../uploads/") });

route.use(auth.main);
route
  .get("/:id", application.getApp)
  .get("/", application.getAppList)
  .get("/:appId/builds/:buildId", build.get)
  .get("/:appId/builds/:buildId/artifacts", build.artifacts)
  .get("/:appId/builds", build.list)
  .post("/", application.createApp)
  .post("/:appId/builds", upload.single("file"), application.newBuild)
  .del("/:id", application.deleteApp);

module.exports = route;
