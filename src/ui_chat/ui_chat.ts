
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { Builder, By, Key, ThenableWebDriver, until, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import { Options } from 'selenium-webdriver/chrome';
import logging from '../logging/logging';
import get_config from '../utils/get_config';
import ffmpeg from 'fluent-ffmpeg';
import is_linux from '../utils/is_linux';
import { execSync } from 'child_process';


ffmpeg.setFfmpegPath("./ffmpeg/bin/ffmpeg.exe");
ffmpeg.setFfprobePath("./ffmpeg/bin/ffprobe.exe");


namespace ui_chat {

    let driver_build = new Builder()
        .forBrowser('chrome')
        .setChromeOptions(new Options().windowSize({ width: 400, height: 430}))
    let driver: WebDriver;

    let log = logging.get_logger();
    let screenshot_interval: NodeJS.Timeout;
    let frames_done: number = 0;

    function initlize_folders() {
        if(!existsSync("./cache")) {
            log.info("Creating cache folder");
            mkdirSync("./cache");
        }
        if(!existsSync("./cache/chat")) {
            log.info("Creating chat folder");
            mkdirSync("./cache/chat");
        } else {
            if (is_linux())
                execSync("rm -rf ./cache/chat/*");
            else
                execSync("del /s /q cache/chat/*");
        }
    }

    export async function initlize() {
        log.info("Initializing Chat's Frontend");
        frames_done = 0;

        initlize_folders();
        
        driver = (await driver_build.build());
        
        await driver.get(`http://localhost:${get_config().serverPort}/chat/chat.html`);

        log.info("Chat's Frontend Initialized");
    }

    export async function take_frame() {
        let screenshot = await driver.takeScreenshot();
        writeFileSync(`./cache/chat/${frames_done++}.png`, screenshot, 'base64');
    }
    export async function convert_to_video(): Promise<string> {

        return new Promise(async (resolve, reject) => {
            log.info("Converting chat to video");
            clearInterval(screenshot_interval)
            await driver.quit();
            let file_name: string = `chat-${Date.now()}.${get_config().videoFormat}`;

            ffmpeg()
                .addOptions([
                    "-i ./cache/chat/%d.png"
                ])
                .output(`./cache/chat/${file_name}`)
                .on('start', (commandLine) => {
                    log.debug(commandLine);
                })
                .on('end', async () => {
                    await initlize();

                    log.info("Chat converted to video")
                    resolve(file_name);
                })
                .on('error', (err) => {
                    log.error(err);
                    reject(err);
                }).run();
            
            log.info("Chat converted to video");
        });
    }
    
}

export default ui_chat;
