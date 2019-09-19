const Promise = require("bluebird");
const models = require("../../models");
const camelize = require("camelize");
const _ = require("lodash");

module.exports = async ctx => {
  let applications;
  try {
    applications = await models.application.getApplitationList();
  } catch (err) {
    return Promise.reject(err);
  }
  applications = await Promise.map(applications, async app => {
    app.lastBuild = await models.build.lastBuildFormatted(app.id);
    return app;
  });

  ctx.body = camelize(applications);
};
