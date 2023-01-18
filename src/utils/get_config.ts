import fs from 'fs';
import { t_config } from '../types/t_config';
import { tk_config } from './../types/t_config';
import { is_valid_config } from './is_valid_config';

export default function get_config(): t_config | null {
    if (!fs.existsSync("./config.json")) {
        console.error("The `config.json` file is missing. Please create it and try again.");
        return null;
    }

    let config: t_config | null = null;

    try {
        config = JSON.parse(fs.readFileSync("./config.json", "utf8")) as t_config;
        config = is_valid_config(config) ? config : null;
    } catch (ex) {
        if (ex instanceof SyntaxError) {
            console.error("`Config.json` is not a valid JSON file. Please double-check for any syntax errors.");
        }
    }

    
    return config;
};