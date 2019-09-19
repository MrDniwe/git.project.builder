"use strict";

const Promise = require("bluebird");
const _ = require("lodash");
const check = require("check-types");
const { application, build } = require("../../models");
const camelize = require("camelize");
const gitlab = require("../../libs/gitlab");
const config = require("../../config");
const fs = require("fs");

module.exports = async ctx => {
  let { appId, buildId } = ctx.params;
  appId = _.toInteger(appId);
  buildId = _.toInteger(buildId);
  if (!check.integer(appId))
    ctx.throw(400, "Переданный appId не является integer");
  if (!check.integer(buildId))
    ctx.throw(400, "Переданный buildId не является integer");
  let app, project, bld, jobs, data;
  try {
    app = await application.appInfo(appId);
  } catch (err) {
    ctx.throw(404, "Не найдено приложение по переданному идентификатору");
  }
  try {
    bld = await build.getByIdFormatted(buildId);
  } catch (err) {
    ctx.throw(404, "Не найден билд по переданному идентификатору");
  }
  try {
    project = await gitlab.getProjectInfo(app.repository);
  } catch (err) {
    ctx.throw(404, "Не найден gitlab проект");
  }
  try {
    jobs = await gitlab.jobsByBuildname(project.body && project.body.id, bld.number);
  } catch (err) {
    ctx.throw(404, "Не найдены jobs по проекту и билду");
  }
  let autoBuildJob = _.maxBy(
    _.filter(jobs, job => {
      return (
        job.name === config.artifacts.jobName &&
        job.status === config.artifacts.jobStatus
      );
    }),
    job => {
      return job.id;
    }
  );
  if (!autoBuildJob) {
    ctx.throw(404, "Не найден подходящий job");
  }
  try {
    ctx.body = ctx.req.pipe(gitlab.artifactsByJob(project.body && project.body.id, autoBuildJob.id));
  } catch (err) {
    ctx.throw(404, "Не найден файл артефактов");
  }
};
