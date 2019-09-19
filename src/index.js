const Koa = require("koa");
const app = new Koa();
const router = require("./routes");
const _ = require("lodash");
const errors = require("./libs/errors");
const bodyParser = require("koa-bodyparser");
const logger = require("./libs/logger");
const restLogger = require("./libs/restLogger");
const scheduler = require("./scheduler");

app.context.logger = logger;
app.use(restLogger);
app.use(errors);
app.use(bodyParser());

//роуты под REST
app.use(router.application.routes());
app.use(router.application.allowedMethods());

app.use(router.incoming.routes());
app.use(router.incoming.allowedMethods());

app.listen(3000);

// запускаем планировщик,
// переданный false запускает функцию планировщика однократно при старте приложения,
// по-умолчанию true
scheduler.run(true);
