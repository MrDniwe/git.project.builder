const db = require("../db");
const check = require("check-types");
const Promise = require("bluebird");

const mask = {
  bundle_id: "string",
  subject_id: 1,
  template_id: 1,
  platform: "string",
  available_version_number: "string"
};

module.exports = {
  createApplication: async params => {
    try {
      check.assert.like(params, mask);
    } catch (err) {
      return Promise.reject(
        "Объект, переданный в модель для добавления приложения, не имеет некоторых обязательных полей"
      );
    }

    let newApp;
    const insertQuery = `
      insert into application 
        (bundle_id, subject_id, template_id, platform, available_version_number)
      values ($[bundle_id], $[subject_id], $[template_id], $[platform], $[available_version_number])
      returning id`;
    const selectQuery = `
    select 
      appid as id, 
      bundle_id, 
      type, 
      platform, 
      subject_id, 
      available_version_number 
    from
      (select 
         id as appid, 
         bundle_id,
         subject_id,
         platform,
         available_version_number,
         template_id
      from 
        application 
      where id=$1) 
        as a inner join
      (select 
        id as tid, 
        app_type as type 
      from template) 
        as b on a.template_id = b.tid`;

    try {
      let insertedApp = await db.one(insertQuery, params);
      newApp = await db.one(selectQuery, [insertedApp.id]);
    } catch (err) {
      return Promise.reject(err);
    }

    return Promise.resolve(newApp);
  },

  getApplication: async appId => {
    try {
      check.assert.integer(appId);
    } catch (err) {
      return Promise.reject("Переданный ID приложения не является integer");
    }

    let application;
    const query = `select * from application where id=$1`;

    try {
      application = await db.one(query, [appId]);
    } catch (err) {
      let notFoundErr = new Error("Приложение с указанным ID не найдено");
      notFoundErr.status = 404;
      return Promise.reject(notFoundErr);
    }

    return Promise.resolve(application);
  },
  getApplicationFormatted: async appId => {
    try {
      check.assert.integer(appId);
    } catch (err) {
      return Promise.reject("Переданный ID приложения не является integer");
    }

    let application;
    const query = `
    select 
      appid as id, 
      bundle_id, 
      type, 
      platform, 
      subject_id, 
      available_version_number 
    from
      (select 
         id as appid, 
         bundle_id,
         subject_id,
         platform,
         available_version_number,
         template_id
      from 
        application 
      where id=$1) 
        as a inner join
      (select 
        id as tid, 
        app_type as type 
      from template) 
        as b on a.template_id = b.tid`;
    try {
      application = await db.one(query, [appId]);
    } catch (err) {
      let notFoundErr = new Error("Приложение с указанным ID не найдено");
      notFoundErr.status = 404;
      return Promise.reject(notFoundErr);
    }

    return Promise.resolve(application);
  },

  getApplitationList: async () => {
    let applications;
    const query = `
    select 
      appid as id, 
      bundle_id, 
      type, 
      platform, 
      subject_id, 
      available_version_number 
    from
      (select 
         id as appid, 
         bundle_id,
         subject_id,
         platform,
         available_version_number,
         template_id
      from 
        application) 
        as a inner join
      (select 
        id as tid, 
        app_type as type 
      from template) 
        as b on a.template_id = b.tid`;

    try {
      applications = await db.manyOrNone(query);
    } catch (err) {
      return Promise.reject(err);
    }

    return Promise.resolve(applications);
  },

  setNewVersionForRepository: async (version, repository) => {
    if (!check.nonEmptyString(version))
      return Promise.reject(
        "Не передана новая версия приложения для обнвления"
      );
    if (!check.nonEmptyString(repository))
      return Promise.reject("Не передан репозиторий для обновления версии");

    const query = `
      update application 
      set available_version_number=$1, updated_at = current_timestamp
      where 
	      template_id in 
		      (select id from template where repository=$2)`;
    try {
      await db.none(query, [version, repository]);
    } catch (err) {
      return Promise.reject(err);
    }
    return Promise.resolve();
  },

  getRepositoryForApp: async appId => {
    if (!check.integer(appId))
      return Promise.reject(
        "Не передано ID приложения для получения репозитория"
      );
    const query = `
    select repository 
    from template 
    where 
      id=(select template_id from application where id=$1)
    `;
    let repository;
    try {
      repository = await db.one(query, [appId]);
    } catch (err) {
      let notFoundErr = new Error(
        "Для указанного ID приложения не найдено репозитория"
      );
      notFoundErr.status = 404;
      return Promise.reject(notFoundErr);
    }
    return Promise.resolve(repository.repository);
  },
  appInfo: async appId => {
    if (!check.integer(appId))
      return Promise.reject(
        "Не передано ID приложения для получения репозитория"
      );
    const query = `
      select 
        appId as id,
        app_type as type,
        app.platform as platform,
        subject_id as subject,
        bundle_id as bundle,
        available_version_number as avn,
        repository
      from 
        (select *, id as appId from application where id=$1) as app
          inner join
          (select * from template) as template
          on template.id=app.template_id
      `;
    let application;
    try {
      application = db.one(query, [appId]);
    } catch (err) {
      let notFoundErr = new Error("Приложение не найдено по ID");
      notFoundErr.status = 404;
      return Promise.reject(notFoundErr);
    }
    return Promise.resolve(application);
  },
  delete: async appId => {
    if (!check.integer(appId))
      return Promise.reject("Не передано ID приложения для удаления");
    const query = `
      delete from application
      where id=$1
    `;
    await db.none(query, [appId]);
  }
};
