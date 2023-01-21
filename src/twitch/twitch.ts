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
                await client.get_device_id();
                await client.get_client_id();
                await client.set_playback_access_token();
                await client.get_full_playlist_url();

                logger.info("Twitch initialized");


                resolve(true);
            } catch (ex) {
                logger.error(ex);
                resolve(false) 
            }

            
        });
    }

}
