const tracer = require("tracer");
const path = require("path");
const _ = require("lodash");

const logpath = path.resolve(__dirname, "../../logs");

const errorFileLogger = tracer.dailyfile({
  format: "{{message}}",
  root: logpath,
  maxLogFiles: 3,
  allLogsFileName: "error",
  level: "warn"
});
const consolidatedFileLogger = tracer.dailyfile({
  format: "{{message}}",
  root: logpath,
  maxLogFiles: 3,
  allLogsFileName: "consolidated"
});

const consoleLogger = tracer.colorConsole({
  format: "{{message}}"
});

const restStatLogger = tracer.dailyfile({
  format: "{{message}}",
  root: logpath,
  maxLogFiles: 3,
  allLogsFileName: "rest"
});

module.exports = tracer.console({
  transport: _.compact([
    data => errorFileLogger[data.title](data.output),
    data => consolidatedFileLogger[data.title](data.output),
    data => data.title !== "trace" && consoleLogger[data.title](data.output),
    data => data.title === "trace" && restStatLogger[data.title](data.output)
  ])
});
