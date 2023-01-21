import ffmpeg from 'fluent-ffmpeg'
import client from './modules/client';
import fs from 'fs';
import logging from '../logging/logging';
import globals from './globals';
import get_config from '../utils/get_config';
import { execSync } from 'child_process';



export namespace twitch {

    let logger = logging.get_logger().withContext("twitch");

    export function initlize(channel_name: string = get_config().targetUsername): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            logger.info("Initializing Twitch");
            try {
                globals.channel_name = channel_name;
                
                await client.set_playback_access_token();

                logger.info("Twitch initialized");


                resolve(true);
            } catch (ex) {
                logger.error(ex);
                resolve(false) 
            }

            
        });
    }

}
