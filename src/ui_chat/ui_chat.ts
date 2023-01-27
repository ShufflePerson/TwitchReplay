
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { Builder, By, Key, ThenableWebDriver, until, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import { Options } from 'selenium-webdriver/chrome';
import logging from '../logging/logging';
import get_config from '../utils/get_config';
import ffmpeg from 'fluent-ffmpeg';
import is_linux from '../utils/is_linux';
import { execSync } from 'child_process';


namespace ui_chat {

    let driver_build = new Builder()
        .forBrowser('chrome')
        .setChromeOptions(new Options().windowSize({ width: 380, height: 730}))
    let driver: WebDriver;

    let log = logging.get_logger();
    let interval_for_frame = 1000;

    function initlize_folders() {
        if(!existsSync("./cache")) {
            log.info("Creating cache folder");
            mkdirSync("./cache");
        }
        if(!existsSync("./cache/chat")) {
            log.info("Creating chat folder");
            mkdirSync("./cache/chat");
        } else {
            log.info("Deleting chat folder");
            if (is_linux())
                execSync("rm -rf ./cache/chat");
            else
                execSync("rmdir /s /q cache/chat");

            initlize_folders();
        }
    }

    export async function initlize() {
        log.info("Initializing Chat's Frontend");

        initlize_folders();
        
        driver = (await driver_build.build());
        
        await driver.get(`http://localhost:${get_config().serverPort}/chat/chat.html`);

        let current_numb: number = 0;
        
        setInterval(async () => {
            let screenshot = await driver.takeScreenshot();
            writeFileSync(`./cache/chat/${current_numb++}.png`, screenshot, 'base64');
        }, interval_for_frame)

        log.info("Chat's Frontend Initialized");
    }

    export async function convert_to_video() {
        log.info("Converting chat to video");
        await driver.quit();
        log.info("Chat converted to video");
    }
    
}

export default ui_chat;
