const {build} = require('../../models');
const logger = require('../../libs/logger');
const gitlab = require('../../libs/gitlab');
const Promise = require('bluebird');
const rimraf = Promise.promisify(require('rimraf'));
const Git = require('nodegit');
const moment = require('moment');
const src = require('./source');
const repoProcessing = require('./repoProcessing');

const singleBuild = async currentBuild => {
  // получаем актуальный id репозитория и указание на метод (бранч или чекаут)
  try {
    await build.setBuildStatusInProgress(currentBuild.id);
  } catch (err) {
    logger.error('Не получается сменить статус билда на in_progress', err);
    throw err;
  }
  let branchPathOuter;
  try {
    // обновляем версию по репозиторию
    const {source, app} = await src(currentBuild);
    // определяем базовую подпись
    const signature = await gitlab.signature();
    // определяем базовые константы
    const cloneOptions = await gitlab.cloneOptions(app);
    // клонируем и возвращаем репозиторий и папку где он лежит
    const {repo, branchPath} = await gitlab.cloneTemporary(
      source,
      currentBuild,
      app,
      cloneOptions,
    );
    branchPathOuter = branchPath;
    // работаем с ветками
    if (!source.method) throw new Error('no strategy found');
    let newBranchRef = await repo.createBranch(
      source.branchName,
      await repo.getCommit(source.commit),
      0,
      signature,
      'checkout existing branch',
    );
    if (source.method === 'checkout')
      await Git.Branch.setUpstream(newBranchRef, `origin/${source.branchName}`);
    await repo.checkoutBranch(source.branchName);

    //заполняем клон репозитория файлами
    await repoProcessing(branchPath, currentBuild.content_path, app, source);

    // сохраняем изменения
    let index = await repo.refreshIndex();
    await index.addAll();
    await index.write();
    let oid = await index.writeTree();
    let parent = await repo.getCommit(
      await Git.Reference.nameToId(repo, 'HEAD'),
    );

    // Коммитим
    let newCommit = await repo.createCommit(
      'HEAD',
      signature,
      signature,
      `New build for v${currentBuild.version} ${app.type} ${
        app.subject
      } at ${moment().format('DD.MM.YY HH:mm')}`,
      oid,
      [parent],
    );
    await build.setCommitHash(currentBuild.id, `${newCommit}`);

    // Пушим
    let remote = await repo.getRemote('origin');
    await remote.connect(
      Git.Enums.DIRECTION.PUSH,
      cloneOptions.fetchOpts.callbacks,
    );
    // создаем тег
    // let newParent = await repo.getCommit(
    //   await Git.Reference.nameToId(repo, 'HEAD'),
    // );
    // let tag = await Git.Tag.create(
    //   repo,
    //   'someTag',
    //   newParent,
    //   signature,
    //   'test some tag',
    //   1,
    // );
    // конец тега
    await remote.push(
      [`refs/heads/${source.branchName}:refs/heads/${source.branchName}`],
      cloneOptions.fetchOpts,
    );
    // пушим тег
    // await remote.push(
    //   [`refs/tags/someTag:refs/tags/someTag`],
    //   cloneOptions.fetchOpts,
    // );
    // конец пуша тега
    await rimraf(branchPath);
    await build.setBuildStatus(currentBuild.id, 'done');
  } catch (err) {
    try {
      await build.setBuildStatus(currentBuild.id, 'error');
    } catch (err) {
      logger.error('Не получается сменить статус билда на error', err);
    }
    if (branchPathOuter) await rimraf(branchPathOuter);
    throw err;
  }
};

module.exports = async () => {
  // ищем билд(ы) в статусе waiting
  const waitingBuilds = await build.getWaitingBuildsFromQueue();
  await Promise.each(waitingBuilds, singleBuild);
};
