const {application} = require('../../models');
const gitlab = require('../../libs/gitlab');
const _ = require('lodash');

module.exports = async currentBuild => {
  const app = await application.appInfo(currentBuild.application_id);
  const branches = await gitlab.getProjectBranches(app.repository);
  let source = {
    version: currentBuild.version,
    commit: null,
    method: null,
    branchName: `${app.type}_${app.subject}_v${currentBuild.version}${
      currentBuild.approve ? '_approve' : ''
    }`,
  };

  // ищем номер версии в билдах (название ветки)
  // если нашли - берем ID последнего коммита, устанавливаем сохраняем признак 'накатить'
  const exactBuild = _.find(
    branches,
    branch => branch.name === source.branchName,
  );
  if (exactBuild) {
    source.commit = exactBuild.commit.id;
    source.method = 'checkout';
  }
  // иначе ищем версию среди тегов release_, елси находим - берем ID коммита, сохраняем признак 'новая ветка'
  if (!source.commit) {
    let releaseCommit = await gitlab.findExactReleaseTag(
      app.repository,
      source.version,
    );

    if (releaseCommit) {
      source.commit = releaseCommit.commit.id;
      source.method = 'branch';
    }
  }
  // елси не находим - кидаем ошибку, т.к. не найден исходный коммит
  if (!source.commit)
    throw new Error(
      400,
      `Подходящий коммит для нового билда не был найден ни среди имеющихся билдов, ни среди релизных тегов. 
      Последняя доступная версия ${
        app.avn ? app.avn : 'отсутствует в принципе'
      }`,
    );

  return {source, app, branches};
};
