'use strict';
const Promise = require('bluebird');
const GitlabAPI = require('node-gitlab-api');
const GitlabExt = require('./gitlab-extended');
const helpers = require('./helpers');
const _ = require('lodash');
const config = require('../config');
const moment = require('moment');
const Git = require('nodegit');
const url = require('url');
const fs = require('fs');
const stat = Promise.promisify(fs.stat);
const mkdir = Promise.promisify(fs.mkdir);
const rimraf = Promise.promisify(require('rimraf'));
const path = require('path');
const gitlab = GitlabAPI({
  url: config.common.repository,
  token: config.common.repositoryToken,
});

const gitlabExt = new GitlabExt({
  url: config.common.repository,
  token: config.common.repositoryToken,
});

module.exports = {
  getProjectInfo: async project => {
    return await gitlab.projects.show(project);
  },
  getProjectTags: async project => {
    return await gitlab.projects.repository.listTags(project);
  },
  getProjectBranches: async project => {
    return await gitlab.projects.repository.listBranches(project);
  },
  showMasterBranch: async project => {
    return await gitlab.projects.repository.showBranch(project, 'master');
  },
  listCommits: async project => {
    return await gitlab.projects.repository.listCommits(project);
  },
  getLastBuild: async (type, subjectId, repository) => {
    let lastBuildVersion;
    try {
      const branches = await gitlab.projects.repository.listBranches(
        repository,
      );
      const subjectBranches = helpers.orderSubjectsBranches(
        type,
        subjectId,
        branches,
      );
      lastBuildVersion = helpers.lastBuildVersion(subjectBranches);
    } catch (err) {
      return Promise.reject(err);
    }
    return Promise.resolve(lastBuildVersion);
  },
  findExactReleaseTag: async (repository, version) => {
    const tags = await gitlab.projects.repository.listTags(repository);
    return _.find(tags, tag => tag.name === `release_v${version}`);
  },
  signature: async () => {
    return Git.Signature.create(
      config.common.repositoryUser || 'Bot',
      config.common.repositoryUserEmail || 'null@null.com',
      _.toInteger(moment().format('X')),
      0,
    );
  },
  cloneOptions: async app => {
    return {
      fetchOpts: {
        callbacks: {
          credentials: () =>
            Git.Cred.userpassPlaintextNew(
              config.common.repositoryUser,
              config.common.repositoryPassword,
            ),
        },
      },
    };
  },
  cloneTemporary: async (source, currentBuild, app, cloneOptions) => {
    const branchPath = path.resolve(
      config.common.rootPath,
      'branches',
      `${source.branchName}_${currentBuild.id}`,
    );
    let stats;
    try {
      stats = await stat(branchPath);
    } catch (err) {}
    if (stats) await rimraf(branchPath);
    await mkdir(branchPath);
    const repo = await Git.Clone(
      url.resolve(config.common.repository, app.repository),
      branchPath,
      cloneOptions,
    );
    return {repo, branchPath};
  },

  jobsByBuildname(projectId, buildName) {
    return gitlabExt.jobsByBuildname(projectId, buildName);
  },
  artifactsByJob(projectId, jobId) {
    return gitlabExt.artifactsByJob(projectId, jobId);
  },
};
