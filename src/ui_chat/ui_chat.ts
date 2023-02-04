
import { existsSync, mkdirSync, writeFileSync } from 'fs';
//import { Builder, By, Key, ThenableWebDriver, until, WebDriver } from 'selenium-webdriver';
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

import puppeteer from 'puppeteer';
import { Browser, Page } from 'puppeteer';



ffmpeg.setFfmpegPath("./ffmpeg/bin/ffmpeg.exe");
ffmpeg.setFfprobePath("./ffmpeg/bin/ffprobe.exe");


let delay = (ms: number) => new Promise(res => setTimeout(res, ms));

namespace ui_chat {
    let browser: Browser;
    let page: Page;


    let log = logging.get_logger();
    let screenshot_interval: NodeJS.Timeout;
    let frames_done: number = 0;

    let width = 630;
    let height = 620;

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

    export async function initlize() {
        log.info("Initializing Chat's Frontend");
        frames_done = 0;

        initlize_folders();

        let url = `http://localhost:${get_config().serverPort}/chat/chat.html`;
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--disable-infobars',
            ]
        });
        page = await browser.newPage();
        await page.goto(url);
        await page.setViewport({ width, height });
        await page.evaluate(() => (document.body.style.background = 'transparent'))





        log.info("Chat's Frontend Initialized");
    }

    function add_chat_message(message: t_chat_ui_message) {
        page.evaluate(get_add_chat_message_script(message));
    }

    export async function test_chat() {
        for (let i = 0; i < 100; i++) {
            add_chat_message({
                text: "OMEGALUL so true " + i.toString() + " OMEGALUL",
                username: "Arthium",
                color: "#1111EE",
                emotes: {
                    OMEGALUL: "https://cdn.frankerfacez.com/emoticon/128054/2"
                },
                badges: ["https://static-cdn.jtvnw.net/badges/v1/affddbd9-df5d-4c55-935f-d75767585ee9/2"]
            })


            await take_frame()


        }

        await browser.close();
        await convert_to_video("./clips/xqc_1674906587400.mkv");
    }



    export async function take_frame() {
        const elements = await page.$('body')
        let screenshot: string = (await elements.screenshot({ encoding: 'base64', omitBackground: true })) as string;
        //let buffer_screenshot = Buffer.from(screenshot, 'base64');

        //screenshot = await make_transparent(buffer_screenshot);
        writeFileSync(`./cache/chat/${frames_done++}.png`, screenshot, 'base64');

        log.debug(`Took frame ${frames_done - 1}`);
    }

    export async function convert_to_video(clip: string) {
        let file_name: string = `./cache/chat/chat-${Date.now()}.${get_config().videoFormat}`;

        await video.images_to_video("./cache/chat/%d.png", file_name, "1");
        let output = "." + clip.split('.')[1] + "-chat." + clip.split('.')[2];

        return video.combine_videos(file_name, clip, output)
    }

}

export default ui_chat;
