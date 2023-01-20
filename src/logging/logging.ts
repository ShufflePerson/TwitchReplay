import { Logger, ConsoleHandler, LogLevel } from "logging-library";



namespace logging {
    export let logger = new Logger()
        .addHandler(new ConsoleHandler(LogLevel.INFO))

    export function init() {
        if (process.env.ENVIRONMENT === "development")
            logger = new Logger().addHandler(new ConsoleHandler(LogLevel.DEBUG))
    }
}

export default logging;