const db = require('../db');
const check = require('check-types');
const Promise = require('bluebird');

module.exports = {
  findLastBuildForApp: async appId => {
    const query = `
      select * from build 
      where application_id = $1
      order by created_at desc
      limit 1
    `;
    let build;
    build = await db.oneOrNone(query, [appId]);
    return build;
  },
  lastBuildFormatted: async appId => {
    const query = `
      select
        id,
        application_id as app_id,
        build_status as status,
        build_number as number,
        version as version_number,
        created_at,
        updated_at
      from build 
      where application_id = $1
      order by created_at desc
      limit 1
    `;
    let build;
    build = await db.oneOrNone(query, [appId]);
    return build;
  },
  findLastBuildForAppVersion: async (appId, version) => {
    const query = `
      select * from build 
      where 
        application_id = $1 and
        version = $2
      order by created_at desc
      limit 1
    `;
    return await db.oneOrNone(query, [appId, version]);
  },
  create: async fields => {
    const query = `
      insert into build
        (application_id, content_path, build_status, commit, build_number, version, file_hash, approve)
      values
        ($[application_id], $[content_path], $[build_status], $[commit], $[build_number], $[version], $[file_hash], $[approve])
      returning id
    `;
    return await db.one(query, fields);
  },
  getById: async id => {
    const query = `
      select * from build where id=$1
    `;
    return await db.one(query, [id]);
  },
  getByIdFormatted: async id => {
    const query = `
      select 
        id,
        application_id as app_id,
        build_status as status,
        build_number as number,
        version as version_number,
        created_at,
        updated_at
      from build where id=$1
    `;
    return await db.one(query, [id]);
  },
  getWaitingBuildFromQueue: async () => {
    const query = `
      select * from build
      where inner_state='waiting'
      order by created_at
      limit 1
    `;
    return await db.oneOrNone(query);
  },
  getWaitingBuildsFromQueue: async () => {
    const query = `
      select * from build
      where 
        inner_state='waiting' or
        (inner_state='error' and attempts <= 5 and updated_at< current_timestamp - interval '5 minutes')
    `;
    return await db.manyOrNone(query);
  },
  setBuildStatus: async (id, status) => {
    try {
      check.assert.integer(id);
      check.assert.nonEmptyString(status);
    } catch (err) {
      throw new Error(
        'Неверные входные данные для метода модели build.setBuildStatus',
      );
    }
    const query = `
      update build
      set 
        inner_state = $2,
        updated_at = current_timestamp
      where id=$1
    `;
    return await db.none(query, [id, status]);
  },
  setBuildStatusInProgress: async id => {
    try {
      check.assert.integer(id);
    } catch (err) {
      throw new Error(
        'Неверные входные данные для метода модели build.setBuildStatusInProgress',
      );
    }
    const query = `
      update build
      set 
        inner_state = 'in_progress',
        updated_at = current_timestamp,
        attempts = attempts+1
      where id=$1
    `;
    return await db.none(query, [id]);
  },
  setCommitHash: async (id, hash) => {
    try {
      check.assert.integer(id);
      check.assert.nonEmptyString(hash);
    } catch (err) {
      throw new Error(
        'Неверные входные данные для метода модели build.setCommitHash',
      );
    }
    const query = `
      update build
      set
        commit=$1
      where id=$2
    `;
    return await db.none(query, [hash, id]);
  },
  updatePipelineStatus: async (commit, id, status) => {
    try {
      check.assert.nonEmptyString(commit);
      check.assert.integer(id);
      check.assert.nonEmptyString(status);
    } catch (err) {
      throw new Error(
        'Неверные входные данные для метода модели build.updatePipelineStatus',
      );
    }
    const query = `
      update build
      set
        build_status = $1,
        build_number = $2
      where commit = $3
    `;
    return await db.manyOrNone(query, [status, id, commit]);
  },
  list: async appId => {
    try {
      check.assert.integer(appId);
    } catch (err) {
      throw new Error('Неверные входные данные для метода модели build.list');
    }
    const query = `
      select
        id,
        application_id as app_id,
        build_status as status,
        build_number as number,
        version as version_number,
        created_at,
        updated_at
      from build
      where
        application_id=$1
    `;
    return await db.manyOrNone(query, [appId]);
  },
};
