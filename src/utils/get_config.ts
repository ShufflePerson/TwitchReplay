import fs from 'fs';
import { t_config } from '../types/t_config';
import { tk_config } from './../types/t_config';

export default function get_config(): t_config | null {
    if (!fs.existsSync("./config.json")) {
        console.error("The `config.json` file is missing. Please create it and try again.");
        return null;
    }

    let config: t_config | null = null;

    try {
        config = JSON.parse(fs.readFileSync("./config.json", "utf8")) as t_config;
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
            console.error(`The following keys are missing from the config file: ${missing_keys.join(", ")}`);
            return null;
        }

        if (!only_required_keys) {
            console.warn(`The following keys are in the config file that are not valid options: ${invalid_keys.join(", ")}`);
            console.warn("While it is not required, it is recommended to remove these keys from the config file.");
        }
        

    } catch (ex) {
        if (ex instanceof SyntaxError) {
            console.error("`Config.json` is not a valid JSON file. Please double-check for any syntax errors.");
        }
    }

    
    return config;
};