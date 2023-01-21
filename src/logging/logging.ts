import { Logger, ConsoleHandler, LogLevel, BaseHandler } from "logging-library";
import { LogRecord } from "logging-library/lib/types/log-record";
import fs from 'fs';



//custom handler

class log_handler extends BaseHandler {
    constructor(level: LogLevel | LogLevel[]) {
        super(level);
    }

    protected log(record: LogRecord) {
        let msg = record.message;
        switch (record.level) {
            case LogLevel.DEBUG:
                msg = `[   DEBUG   ] -> \x1b[36m${msg}\x1b[0m`;
                break;
            case LogLevel.INFO:
                msg = `[    INFO   ] -> \x1b[32m${msg}\x1b[0m`;
                break;
            case LogLevel.WARNING:
                msg = `[  WARNING  ] -> \x1b[33m${msg}\x1b[0m`;
                break;
            case LogLevel.ERROR:
                msg = `[   ERROR   ] -> \x1b[31m${msg}\x1b[0m`;
                break;
            case LogLevel.CRITICAL:
                msg = `[  CRITICAL ] -> \x1b[31m${msg}\x1b[0m`;
                break;
        }

        fs.appendFileSync("./debug.log", msg + " \r\n");
        console.log(msg);
    }
} namespace logging {
    let logger = new Logger()
        .addHandler(new log_handler([LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARNING, LogLevel.ERROR, LogLevel.CRITICAL]))

    export function init() {
        fs.writeFileSync("./debug.log", "");
    }

    export function get_logger() {
        return logger;
    }
}

export default logging;