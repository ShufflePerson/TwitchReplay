import { Logger, ConsoleHandler, LogLevel } from "logging-library";



namespace logging {
    let logger = new Logger()
        .addHandler(new ConsoleHandler([LogLevel.DEBUG, LogLevel.INFO]))

    export function init() {
        if (process.env.ENVIRONMENT === "development")
            logger = new Logger().addHandler(new ConsoleHandler([LogLevel.DEBUG, LogLevel.INFO]))
    }

    export function get_logger() {
        return logger;
    }
}

export default logging;