const constraints = require('../../libs/constraints');
const renewAVN = require('./renewAvailableVersionNumber');
const _ = require('lodash');
const check = require('check-types');
const models = require('../../models');
const gitlab = require('../../libs/gitlab');
const config = require('../../config');
const fs = require('fs');
const Promise = require('bluebird');
const jszip = require('jszip');
const helpers = require('../../libs/helpers');
const md5file = require('md5-file/promise');
const path = require('path');
const camelize = require('camelize');

module.exports = async ctx => {
  //начальные проверки
  try {
    await constraints.filePresents(ctx.req);
    await constraints.mimetypeIsZip(ctx.req);
  } catch (err) {
    ctx.throw(400, err);
  }

  let {appId} = ctx.params;
  appId = _.toInteger(appId);
  if (!check.integer(appId))
    ctx.throw(400, 'Переданный appId не является integer');

  // обновляем версию по репозиторию
  // получаем инфо о приложении
  // получаем список бранчей репозитория
  let application;
  let branches;
  let lastBuild;
  try {
    await renewAVN(appId);
    application = await models.application.appInfo(appId);
    branches = await gitlab.getProjectBranches(application.repository);
    lastBuild = await models.build.findLastBuildForApp(application.id);
  } catch (err) {
    ctx.throw(400, err);
  }

  let source = {
    version: application.avn,
    commit: null,
    method: null,
  };

  // это признак того, нужно ли отправлять версию сразу на аппрув. Храним его в базе для данной сборки и на основании ее коммиту добавим тег
  const approve =
    (ctx.request && ctx.request.query && ctx.request.query.approve) || false;

  if (ctx.request.query && ctx.request.query.version) {
    //версия передана явно, проверяем не будт ли это даунгрейдом, т.е. ищем ветки этой версии
    if (!config.reg.version.test(ctx.request.query.version))
      ctx.throw(
        400,
        `Вы передали номер версии, но он не валидный (${
          ctx.request.query.version
        }), нужен номер в формате 1.2.3`,
      );
    const bv =
      lastBuild &&
      lastBuild.version &&
      lastBuild.version
        .split('.')
        .map(n => +n + 100000)
        .join('.');
    const cv = ctx.request.query.version
      .split('.')
      .map(n => +n + 100000)
      .join('.');
    if (lastBuild && lastBuild.version && cv < bv)
      ctx.throw(
        400,
        `Вы передали номер версии (${
          ctx.request.query.version
        }), но для данного субъекта уже есть более поздний билд (${
          lastBuild.version
        }), 
          укажите более позднюю версию, или не указывайте вообще`,
      );
    source.version = ctx.request.query.version;
  }

  // ищем номер версии в билдах (название ветки)
  // если нашли - берем ID последнего коммита, устанавливаем сохраняем признак 'накатить'
  const exactBuild = _.find(
    branches,
    branch =>
      branch.name ===
      `${application.type}_${application.subject}_v${source.version}`,
  );
  if (exactBuild) {
    source.commit = exactBuild.commit.id;
    source.method = 'checkout';
  }
  // иначе ищем версию среди тегов release_, елси находим - берем ID коммита, сохраняем признак 'новая ветка'
  if (!source.commit) {
    let releaseCommit;
    try {
      releaseCommit = await gitlab.findExactReleaseTag(
        application.repository,
        source.version,
      );
    } catch (err) {
      ctx.throw(400, err);
    }
    if (releaseCommit) {
      source.commit = releaseCommit.commit.id;
      source.method = 'branch';
    }
  }
  // елси не находим - кидаем ошибку, т.к. не найден исходный коммит
  if (!source.commit)
    ctx.throw(
      400,
      `Подходящий коммит для нового билда не был найден ни среди имеющихся билдов, ни среди релизных тегов. 
      Последняя доступная версия ${
        application.avn ? application.avn : 'отсутствует в принципе'
      }`,
    );

  //сверяем хеш имеющегося последнего билда этой версии с хешем загруженного массива
  const currentHash = await md5file(ctx.req.file.path);
  const lastVersionBuild = await models.build.findLastBuildForAppVersion(
    application.id,
    source.version,
  );
  if (lastVersionBuild && lastVersionBuild.file_hash === currentHash) {
    ctx.throw(400, 'Точно такой же файл для этой версии уже был загружен');
  }

  //читаем переданный zip
  const readFile = Promise.promisify(fs.readFile);
  let zip;
  try {
    const data = await readFile(ctx.req.file.path);
    zip = await jszip.loadAsync(data);
    //проверка архива на состав файлов
    await helpers.checkFilesList(application.platform, zip.files);
    //проверка изображений по параметрам
    await helpers.validateImages(zip, application.platform);
    // проверяем, что Info.json в UTF8
    if (!(await helpers.validateUTF8InfoJsonInArchive(zip)))
      ctx.throw(400, 'Info.json не в кодировке UTF8');
    //валидируем JSON
    await helpers.validateJsonBySchema(zip, application.platform, 'Info.json');
    //валидируем соответствие бандла в GoogleService-Info.plist для ios
    application.platform === 'ios' &&
      (await helpers.validateGoogleService(zip, application.bundle));
  } catch (err) {
    ctx.throw(400, err);
  }

  //На данном этапе у нас уже всё проверено
  //Копируем файл в постоянное хранилище
  const copyFile = Promise.promisify(fs.copyFile);
  const unlink = Promise.promisify(fs.unlink);
  const newpath = path.resolve(
    __dirname,
    '../../../archives',
    ctx.req.file.filename,
  );
  try {
    await copyFile(ctx.req.file.path, newpath);
    await unlink(ctx.req.file.path);
  } catch (err) {
    ctx.throw(400, 'Не удалось переместить исходный массив');
  }
  //это чтобы в случае дальнейших ошибок удалился файл по новому пути
  ctx.req.file.path = newpath;
  //Создаем запись в билдах
  const newBuild = {
    application_id: application.id,
    content_path: path.relative(path.resolve(__dirname, '../../..'), newpath),
    version: source.version,
    file_hash: currentHash,
    build_status: null,
    commit: null,
    build_number: null,
    approve,
  };
  const buildSaved = await models.build.create(newBuild);

  //Возвращаем данные по билду
  ctx.body = camelize(await models.build.getByIdFormatted(buildSaved.id));
};
