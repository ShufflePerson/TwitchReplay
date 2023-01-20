import { Logger, ConsoleHandler, LogLevel } from "logging-library";



namespace logging {
    export const logger = new Logger()
        .addHandler(new ConsoleHandler(LogLevel.INFO))
}

export default logging;