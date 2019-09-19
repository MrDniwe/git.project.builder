module.exports = {
  application: {
    createApp: require("./application/createApp"),
    getApp: require("./application/getApp"),
    getAppList: require("./application/getAppList"),
    newBuild: require("./application/newBuild"),
    renewAVN: require("./application/renewAvailableVersionNumber"),
    deleteApp: require("./application/deleteApp")
  },
  incoming: {
    newVersion: require("./incoming/incomingNewVersion"),
    buildEvent: require("./incoming/incomingBuildEvents")
  },
  build: {
    scheduler: require("./build/scheduler"),
    list: require("./build/list"),
    get: require("./build/get"),
    artifacts: require("./build/artifacts")
  },
  dummy: async ctx => {
    ctx.body = "not implemented yet";
  }
};
