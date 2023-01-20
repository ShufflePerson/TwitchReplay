console.clear();


import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
if (process.env.ENVIRONMENT === "development") dotenv.config({ path: '.env.dev' });



import logging from "./logging/logging";
import client from "./twitch/modules/client";
import globals from './twitch/globals';
import cap_text from "./utils/cap_text";



(async () => {

    logging.init();

    globals.channel_name = "xqc";
    let stream_title: string = await client.get_stream_title();

    logging.get_logger().info(`Stream title: ${cap_text(stream_title)}`);

    await client.set_playback_access_token();

    //await client.get_device_id();


    console.log(globals);
})();

