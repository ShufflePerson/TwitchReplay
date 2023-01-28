
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
        .setChromeOptions(new Options().windowSize({ width: 380, height: 730}))
    let driver: WebDriver;

    let log = logging.get_logger();
    let interval_for_frame = 1000;
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
        }
    }

    export async function initlize() {
        log.info("Initializing Chat's Frontend");
        frames_done = 0;

        initlize_folders();
        
        driver = (await driver_build.build());
        
        await driver.get(`http://localhost:${get_config().serverPort}/chat/chat.html`);

        let current_numb: number = 0;
        
        screenshot_interval = setInterval(async () => {
            let screenshot = await driver.takeScreenshot();
            for (let i = 0; i < 25; i++) {
                writeFileSync(`./cache/chat/${current_numb++}.png`, screenshot, 'base64');
            }
            frames_done++;
        }, interval_for_frame)

        setTimeout(() => {
            convert_to_video();
        }, 10000);

        log.info("Chat's Frontend Initialized");
    }

    export async function convert_to_video(): Promise<string> {

        return new Promise(async (resolve, reject) => {
            log.info("Converting chat to video");
            clearInterval(screenshot_interval)
            await driver.quit();
            let file_name: string = `chat-${Date.now()}.${get_config().videoFormat}`;

            //take all the images and convert them to a video in the same format as ${get_config().targetDirectory}

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
