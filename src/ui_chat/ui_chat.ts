
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { Builder, By, Key, ThenableWebDriver, until, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import { Options } from 'selenium-webdriver/chrome';
import logging from '../logging/logging';
import get_config from '../utils/get_config';
import ffmpeg from 'fluent-ffmpeg';
import is_linux from '../utils/is_linux';
import { execSync } from 'child_process';
import { t_chat_ui_message } from '../types/t_chat_ui_message';
import http from 'http';
import sharp from 'sharp';
import { resolve } from 'path';
import in_tolerence from '../math/in_tolerence';
import { video } from '../video/video';


ffmpeg.setFfmpegPath("./ffmpeg/bin/ffmpeg.exe");
ffmpeg.setFfprobePath("./ffmpeg/bin/ffprobe.exe");


let delay = (ms: number) => new Promise(res => setTimeout(res, ms));

namespace ui_chat {

    let driver_build = new Builder()
        .forBrowser('chrome')
        .setChromeOptions(new Options().addArguments(`--disable-infobars --disable-gpu --app=http://localhost:${get_config().serverPort}/chat/chat.html`).windowSize({ width: 430, height: 520 }))
    let driver: WebDriver;

    let log = logging.get_logger();
    let screenshot_interval: NodeJS.Timeout;
    let frames_done: number = 0;

    function initlize_folders() {
        if (!existsSync("./cache")) {
            log.info("Creating cache folder");
            mkdirSync("./cache");
        }
        if (!existsSync("./cache/chat")) {
            log.info("Creating chat folder");
            mkdirSync("./cache/chat");
        } else {
            if (is_linux())
                execSync("rm -rf ./cache/chat/*");
            else
                execSync("del /s /q cache\\chat\\*");
        }
    }

    function get_add_chat_message_script(message: t_chat_ui_message): string {
        let message_string = JSON.stringify(message);
        return `add_chat_message(${message_string})`;
    }

    function make_transparent(image: string, template_color: number = 154): Promise<string> {
        return new Promise(async (resolve, reject) => {
            let image_buffer = Buffer.from(image, 'base64');
            let image_sharp = sharp(image_buffer);
            let metadata = await image_sharp.metadata();
            let image_data = await image_sharp.raw().toBuffer();
            let image_data_array = new Uint8ClampedArray(image_data);

            let template_color_tolerance = 5;

            for (let i = 0; i < image_data_array.length; i += 4) {
                if (in_tolerence(image_data_array[i], template_color, template_color_tolerance) && in_tolerence(image_data_array[i + 1], template_color, template_color_tolerance) && in_tolerence(image_data_array[i + 2], template_color, template_color_tolerance))
                    image_data_array[i + 3] = 0;
            }
            let image_sharp_transparent = sharp(image_data_array, {
                raw: {
                    width: metadata.width,
                    height: metadata.height,
                    channels: 4
                }
            });

            image = (await image_sharp_transparent.png().toBuffer()).toString('base64');

            resolve(image);
        })
    }

    export async function initlize() {
        log.info("Initializing Chat's Frontend");
        frames_done = 0;

        initlize_folders();

        driver = (await driver_build.build());


        for (let i = 0; i < 10; i++) {
            driver.executeScript(get_add_chat_message_script({
                text: "OMEGALUL so true OMEGALUL",
                username: "Arthium",
                color: "#000000",
                emotes: {
                    OMEGALUL: "https://cdn.frankerfacez.com/emoticon/128054/2"
                },
                badges: ["https://static-cdn.jtvnw.net/badges/v1/affddbd9-df5d-4c55-935f-d75767585ee9/2"]
            }))

            await delay(100);
            await take_frame()


        }


        await driver.quit();
        await convert_to_video();

        log.info("Chat's Frontend Initialized");
    }


    function send_chromedriver(cmd: string, params: any): Promise<boolean> {

        return new Promise(async (resolve, reject) => {
            let session_id = (await (driver.getSession())).getId();
            let resource = `/session/${session_id}/chromium/send_command_and_get_result`;
            let url: string = (await (await driver.getCapabilities()).get('goog:chromeOptions')).debuggerAddress;
            let body = {
                cmd: cmd,
                params: params
            }
            let options = {
                hostname: url.split(":")[0],
                port: url.split(":")[1],
                path: resource,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(JSON.stringify(body))
                }
            };


            let req = http.request(options, (res) => {
                res.on('data', (data) => {
                    log.debug(data.toString());
                });
                res.on('end', () => {
                    log.debug("Request ended")
                    resolve(true);
                });
            });

            req.on('error', (e) => {
                log.error(e);
                reject(e);
            });

            req.write(JSON.stringify(body));
            req.end();


        })

    }


    export async function take_frame() {
        let screenshot = await driver.takeScreenshot();
        screenshot = await make_transparent(screenshot);
        writeFileSync(`./cache/chat/${frames_done++}.png`, screenshot, 'base64');

        log.debug(`Took frame ${frames_done - 1}`);
    }

    export async function convert_to_video() {
        let file_name: string = `./cache/chat/chat-${Date.now()}.${get_config().videoFormat}`;

        return video.images_to_video("./cache/chat/%d.png", file_name, "1");
    }

}

export default ui_chat;
