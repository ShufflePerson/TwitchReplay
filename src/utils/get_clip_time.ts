import get_config from './get_config';
import time_format from 'hh-mm-ss';
import { t_config } from '../types/t_config';


export function get_clip_time(config: t_config | {
    recordLength: string;
} = get_config()): number {
    let length: string = config.recordLength;

    let times = length.split(":");
    for (let i = 0; i < times.length; i++) {
        times[i] = times[i].padStart(2, "0");
    }
    length = times.join(":");

    
    return (time_format.toMs(length));
}