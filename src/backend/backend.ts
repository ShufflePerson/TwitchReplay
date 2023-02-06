import express from 'express';
import { readdir, readdirSync, writeFileSync } from 'fs';
import logging from '../logging/logging';
import client from '../twitch/modules/client';
import get_config from '../utils/get_config';
import globals from './../twitch/globals';
import ffmpeg from 'fluent-ffmpeg'
import { join } from "path";
import clipper from '../clipper/clipper';
import ui_chat from '../ui_chat/ui_chat';
import chat from '../twitch/modules/chat';



namespace backend {
    let app = express();
    let log = logging.get_logger();

    export function initlize() {
        log.info("Initializing the backend.")

        app.use(express.static('public'));
        app.use(express.static(get_config().targetDirectory));
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));

        app.use((req, res, next) => {
            log.debug(`Request: ${req.method} ${req.url}`);
            next();
        });


        app.get("/api/get_config", async (req, res) => {
            let config = {
                title: await client.get_stream_title(),
                channel_name: globals.channel_name,
                settings: get_config()
            }

            res.send(config);
        });

        app.post("/api/save_config", async (req, res) => {
            let config = req.body;

            //a better solution in the future is needed
            writeFileSync("./config.json", JSON.stringify(config, null, 4));

            log.info("Updated config.json file.")

            res.redirect("/");
        });

        app.post("/api/clip", async (req, res) => {
            let { duration } = req.body;
            duration *= 1000;
            let current_clips = readdirSync(get_config().targetDirectory);

            const { file, clip_length } = await clipper.clip(duration / 1000);
            let clip_start = Date.now() - clip_length;
            let clip_end = Date.now();
            let saved_path: string = await ui_chat.convert_and_export(chat.saved_chat.messages, file, clip_start, clip_end);

            if (!saved_path)
                log.error("Failed to clip the stream.");
            else
                log.info("Clip saved to: " + saved_path);



            let new_clip = readdirSync(get_config().targetDirectory).filter(clip => !current_clips.includes(clip))[0];

            res.send({ clips: [new_clip] });
        });



        app.get("/api/clips", async (req, res) => {
            let clips = readdirSync(get_config().targetDirectory);

            res.send({ clips });
        });


        app.listen(get_config().serverPort, () => {
            log.info("Backend listening on port " + get_config().serverPort);
        });

        log.info("Backend initialized.")
    }

}

export default backend;