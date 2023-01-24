
import logging from '../logging/logging';
import { execSync } from 'child_process';
import fs from 'fs';
import is_linux from '../utils/is_linux';
import ffmpeg from 'fluent-ffmpeg';
import client from './../twitch/modules/client';
import globals from './../twitch/globals';
import get_config from './../utils/get_config';
import { resolve } from 'path';

namespace clipper {
    let logger = logging.get_logger().withContext("clipper");
    let mpeg = ffmpeg();

    function initlize_ffmpeg() {
        logger.info("Initializing ffmpeg");

        if (is_linux()) {
            execSync("chmod +x ./ffmpeg/bin/ffmpeg");
            execSync("chmod +x ./ffmpeg/bin/ffprobe");
        }

        ffmpeg.setFfmpegPath("./ffmpeg/bin/ffmpeg.exe");
        ffmpeg.setFfprobePath("./ffmpeg/bin/ffprobe.exe");

        logger.info("Ffmpeg initialized");
    }

    export async function initlize() {
        initlize_folders();
        initlize_ffmpeg();
    }


    function initlize_folders() {
        logger.info("Initializing folders for clips");
        if (fs.existsSync("./cache")) {
            if (is_linux())
                execSync("rm -rf ./cache");
            else
                execSync("rmdir /s /q cache");
        }


        if (!fs.existsSync(`${get_config().targetDirectory}`)) {
            fs.mkdirSync(`${get_config().targetDirectory}`);
        }


        fs.mkdirSync("./cache");
        fs.mkdirSync("./cache/buffer");

        logger.info("Folders initialized");
    }


    export async function start_capture(is_first_run: boolean): Promise<boolean> {

        return new Promise(async (resolve, reject) => {
            logger.info("Starting Capture");
            
            let ffmpeg_options: string[] = [];

            if (is_first_run) {
                ffmpeg_options.push("-ss");
                ffmpeg_options.push("16");
            }

            ffmpeg_options.push("-c");
            ffmpeg_options.push("copy");
            ffmpeg_options.push("-f");
            ffmpeg_options.push("segment");
            ffmpeg_options.push("-segment_time");
            ffmpeg_options.push("5");
            ffmpeg_options.push("./cache/buffer/%d.mp4");


            mpeg = ffmpeg(await client.get_full_playlist_url())
                .addOptions(ffmpeg_options)
                .save(`./cache/${globals.channel_name}.mkv`)
                .on('end', function () {
                    logger.info("Stream ended");
                }).on("start", function (command_line) {
                    logger.info("Capture has been started.");
                    logger.debug(command_line);
                    if (!is_first_run)
                        resolve(true);
                    else {
                        logger.info("Waiting for ad-break to end")
                        setTimeout(() => {
                            logger.info("Ad-break ended. Continuing capture")
                            resolve(true);
                        }, 16 * 1000);
                    }

                }).on("error", function (err) {
                    logger.error("An error occurred: " + err.message)
                    resolve(false);
                }).on("progress", function (progress) {
                    logger.debug("Processing: " + progress.timemark)
                })
        })
    }

    export function restart(): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            logger.info("Restarting capture");
            mpeg.kill("SIGKILL");
            await start_capture(false);
            resolve(true);
        })
    }


    export function clip(time_s: number): Promise<boolean> {
        return new Promise(async (resolve, reject) => {

            let clips_needed: number = Math.floor(time_s / 5);
            let clips_available: number = fs.readdirSync("./cache/buffer").length;

            logger.info("Clips needed: " + clips_needed);
            logger.info("Clips available: " + clips_available);

            if (clips_available < clips_needed) {
                logger.warning("Not enough clips available. Capping to " + clips_available * 5 + " seconds");
                clips_needed = clips_available;
                time_s = clips_available * 5;
            }

            let output_name = `${get_config().targetDirectory}/${globals.channel_name}_${new Date().getTime()}.${get_config().videoFormat}`;

            logger.info("Clipping " + time_s + " seconds to " + output_name);



        })
    }

}


export default clipper;