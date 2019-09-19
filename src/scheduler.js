const { periodMs } = require("./config").scheduler;
const { scheduler } = require("./controllers").build;
const logger = require("./libs/logger");

const scheduleRunner = async () => {
  try {
    await scheduler();
  } catch (err) {
    logger.error(err);
  }
};

module.exports = {
  run: (enabled = true) => {
    enabled ? setInterval(scheduleRunner, periodMs) : scheduleRunner();
  }
};
