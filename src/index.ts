console.clear();


import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
if (process.env.ENVIRONMENT === "development") dotenv.config({ path: '.env.dev' });



import logging from "./logging/logging";
import client from "./twitch/modules/client";
import globals from './twitch/globals';
import cap_text from "./utils/cap_text";
import { twitch } from './twitch/twitch';
import readline from 'readline';
import clipper from './clipper/clipper';
import chat from './twitch/modules/chat';
import backend from './backend/backend';


readline.emitKeypressEvents(process.stdin);


(async () => {

    let logger = logging.get_logger().withContext("main");

    logging.init();
    backend.initlize();


    let twitch_init: boolean = await twitch.initlize();
    if (!twitch_init) {
        logger.error("Failed to initialize. Please check the log file for more information.");
        return;
    }


    await client.get_device_id();
    await chat.initlize();

    let stream_title: string = await client.get_stream_title();

    logging.get_logger().info(`Stream title: ${cap_text(stream_title)}`);
    
    await clipper.initlize();


    logger.info("Attempting to start capture");
    
    let capture_started: boolean = await clipper.start_capture(false);
    if (!capture_started) {
        logger.error("Failed to start capture. Please check the log file for more information.");
        return;
    }


    setTimeout(async () => {
        let clipped: boolean = await clipper.clip(10);
        if (!clipped) {
            logger.error("Failed to clip. Please check the log file for more information.");
            return;
        }

        logger.info("Clip successful");
    }, 12000);


})();





process.on('exit', async () => {
    clipper.clean_up();
});

process.on('SIGINT', async () => {
    clipper.clean_up();
});