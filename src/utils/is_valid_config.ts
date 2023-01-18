import { tk_config, t_config } from "../types/t_config";

let is_valid_config = (config: t_config, log: boolean = true): boolean => {
    let only_required_keys = true;
    let missing_keys: string[] = [];
    let invalid_keys: string[] = [];
    for (const key of tk_config) {
        if (config[key] === undefined) {
            missing_keys.push(key);
        }

        if (!tk_config.includes(key)) {
            invalid_keys.push(key);
            only_required_keys = false;
        }
    }

    if (missing_keys.length > 0) {
        if (log)
            console.warn(`The following keys are missing from the config file: ${missing_keys.join(", ")}`);
        return false;
    }

    if (!only_required_keys) {
        if (log) {
            console.warn(`The following keys are in the config file that are not valid options: ${invalid_keys.join(", ")}`);
            console.warn("While it is not required, it is recommended to remove these keys from the config file.");
        }
    }

    return true;
};


export { is_valid_config }