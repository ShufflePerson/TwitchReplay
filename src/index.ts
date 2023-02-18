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
import ui_chat from './ui_chat/ui_chat';


let logger = logging.get_logger().withContext("main");
readline.emitKeypressEvents(process.stdin);

function start_clearing_service() {
    return; //need to fix this (globals.buffer_size is only the buffer size and not the whole clip len)
    setInterval(() => {
        chat.delete_chat_before(Date.now() - globals.buffer_size * 1000);
    }, globals.buffer_size * 1000);
}


(async () => {


    logging.init();
    backend.initlize();
    ui_chat.initlize();

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

    start_clearing_service();

    logger.info("Attempting to start capture");

    let capture_started: boolean = await clipper.start_capture(false);
    if (!capture_started) {
        logger.error("Failed to start capture. Please check the log file for more information.");
        return;
    }

    ui_chat.start_recording();

/*    setTimeout(() => {
      ui_chat.save_recording(10);
    }, 15000);
*/


    /*
    let test_clip_time = 20;
    setTimeout(async () => {
        logger.info("Exporting clip");
        let clip_start = Date.now() - test_clip_time * 1000;
        let clip_end = Date.now();
        let exported_path: string = await ui_chat.convert_and_export(chat.saved_chat.messages, await clipper.clip(10), clip_start, clip_end);
        logger.info(`Exported clip to ${exported_path}`)
    }, test_clip_time * 1000);
    */


})();







/*
process.on('exit', async () => {
    //clippe.clean_up();
});

process.on('SIGINT', async () => {
    //clipper.clean_up();
});
*/
