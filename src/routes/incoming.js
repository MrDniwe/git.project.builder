const { newVersion, buildEvent } = require("../controllers").incoming;
const Router = require("koa-router");
const auth = require("../libs/auth");
const route = new Router({
  prefix: "/api/incoming"
});

route.use(auth.webhook);
route.post("/newTag", newVersion);
route.post("/buildEvent", buildEvent);

module.exports = route;
