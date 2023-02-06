
import logging from '../logging/logging';
import { execSync } from 'child_process';
import fs, { writeFileSync } from 'fs';
import is_linux from '../utils/is_linux';
import ffmpeg from 'fluent-ffmpeg';
import client from './../twitch/modules/client';
import globals from './../twitch/globals';
import get_config from './../utils/get_config';
import { resolve } from 'path';
import cli_spinners from 'cli-spinners';
import is_dev from '../utils/is_dev';

let sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

namespace clipper {
    let logger = logging.get_logger().withContext("clipper");
    let mpeg = ffmpeg();
    let current_buffer_started = 0

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


    export function initlize_folders() {
        logger.info("Initializing folders for clips");
        if (fs.existsSync("./cache") && fs.existsSync("./cache/buffer")) {
            if (is_linux())
                execSync("rm -rf ./cache/buffer");
            else
                execSync("rmdir /s /q cache\\buffer");
        }


        if (!fs.existsSync(`${get_config().targetDirectory}`)) {
            fs.mkdirSync(`${get_config().targetDirectory}`);
        }


        if (!fs.existsSync("./cache"))
            fs.mkdirSync("./cache");
        if (!fs.existsSync("./cache/buffer"))
            fs.mkdirSync("./cache/buffer");

        logger.info("Folders initialized");
    }


    export async function start_capture(is_first_run: boolean): Promise<boolean> {

        return new Promise(async (resolve, reject) => {
            logger.info("Starting Capture");

            let ffmpeg_options: string[] = [];

            ffmpeg_options.push("-c:v");
            ffmpeg_options.push("copy");
            ffmpeg_options.push("-c:a");
            ffmpeg_options.push("copy");
            ffmpeg_options.push("-f");
            ffmpeg_options.push("segment");
            ffmpeg_options.push("-segment_time");
            ffmpeg_options.push(globals.buffer_size.toString());
            ffmpeg_options.push("-segment_format");
            ffmpeg_options.push("mpegts");
            ffmpeg_options.push("-strict");
            ffmpeg_options.push("-2");
            ffmpeg_options.push("-reset_timestamps");
            ffmpeg_options.push("1");
            ffmpeg_options.push("-segment_list");
            ffmpeg_options.push("./cache/buffer/playlist.m3u8");
            ffmpeg_options.push("-segment_list_flags");
            ffmpeg_options.push("+live");
            ffmpeg_options.push("./cache/buffer/%d.ts");
            ffmpeg_options.push("-c");
            ffmpeg_options.push("copy");
            ffmpeg_options.push("./cache/" + globals.channel_name + ".ts");
            ffmpeg_options.push("-threads");
            ffmpeg_options.push("0");
            ffmpeg_options.push("-r");



            let last_timemark: string = "00:00:00.00";
            let _time = Date.now();

            mpeg = ffmpeg(await client.get_full_playlist_url())
                .addOptions(ffmpeg_options)
                .save(`./cache/${globals.channel_name}.mkv`)
                .on('end', function () {
                    logger.info("Stream ended");
                }).on("start", function (command_line) {
                    logger.info("Capture has been started.");
                    logger.debug(command_line);
                    current_buffer_started = Date.now();
                    setInterval(() => {
                        current_buffer_started = Date.now();
                        logger.debug("New buffer has begun");
                    }, globals.buffer_size * 1000);
                    if (!is_first_run)
                        resolve(true);
                    else {
                        let ad_break_time = 0;
                        logger.info("Waiting for ad-break to end")
                        setTimeout(() => {
                            logger.info("Ad-break ended. Continuing capture")
                            resolve(true);
                        }, ad_break_time);
                    }

                }).on("error", function (err) {
                    logger.error("An error occurred: " + err.message)
                    resolve(false);
                }).on("progress", function (progress) {
                    let time = progress.timemark.split(":");
                    let seconds = (+time[0]) * 60 * 60 + (+time[1]) * 60 + (+time[2]);
                    let last_time = last_timemark.split(":");
                    let last_seconds = (+last_time[0]) * 60 * 60 + (+last_time[1]) * 60 + (+last_time[2]);
                    let diff = seconds - last_seconds;
                    diff = Math.round(diff * 1000) / 1000;

                    logger.info("Progress: " + progress.timemark + " | " + diff + " || Took: " + (Date.now() - _time) / 1000 + "s");
                    _time = Date.now();
                    last_timemark = progress.timemark;
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

    function wait_for_buffer() {
        return new Promise(async (resolve, reject) => {
            setTimeout(() => {
                resolve(true);
            }, (current_buffer_started + globals.buffer_size * 1000 - Date.now()) + 3000);
        })
    }



    export function clip(time_s: number = globals.buffer_size): Promise<{
        file: string,
        clip_length: number
    }> {
        return new Promise(async (resolve, reject) => {

            let buffer_needed: number = Math.round(time_s / globals.buffer_size);
            let buffer_available: number = fs.readdirSync("./cache/buffer").length - 1;

            if (buffer_needed > buffer_available)
                await wait_for_buffer();

            logger.debug("Buffer needed: " + buffer_needed);
            logger.debug("Buffer available: " + buffer_available);


            if (buffer_available < buffer_needed) {
                logger.warning("Not enough clips available. Capping to " + buffer_available * globals.buffer_size + " seconds");
                buffer_needed = buffer_available;
                time_s = buffer_available * globals.buffer_size;
            }

            let output_name = `${get_config().targetDirectory}/${globals.channel_name}_${new Date().getTime()}.${get_config().videoFormat}`;

            logger.info("Clipping " + time_s + " seconds to " + output_name);

            let command = ffmpeg();
            for (let i = buffer_available - buffer_needed; i < buffer_available; i++) {
                command = command.addInput(`./cache/buffer/${i}.ts`);
            }

            command.addOption("-threads", "0");
            command.addOption("-preset", "ultrafast");


            command.mergeToFile(output_name)
                .on("start", function (command_line) {
                    logger.info("Clip started");
                    logger.debug(command_line);
                }).on("error", function (err) {
                    logger.error("An error occurred: " + err.message)
                    resolve({
                        file: "",
                        clip_length: 0
                    });
                }).on("end", function () {
                    logger.info("Clip written");
                    resolve({
                        file: output_name,
                        clip_length: time_s * 1000
                    });
                })





        })
    }

    export function clean_up() {
        mpeg.kill("SIGKILL");

        if (is_dev()) {

            if (is_linux())
                execSync("rm -rf ./cache");
            else
                execSync("rmdir /s /q cache");
        }


        logger.info("Cleaned up");


    }

}


export default clipper;