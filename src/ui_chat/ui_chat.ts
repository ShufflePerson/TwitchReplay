
import { Builder, By, Key, ThenableWebDriver, until, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import { Options } from 'selenium-webdriver/chrome';
import logging from '../logging/logging';
import get_config from '../utils/get_config';


namespace ui_chat {

    let driver_build = new Builder()
        .forBrowser('chrome')
        .setChromeOptions(new Options().headless().windowSize({ width: 1920, height: 1080 }))
    let driver: WebDriver;

    let log = logging.get_logger();

    export async function initlize() {
        log.info("Initializing Chat's Frontend");
        
        driver = (await driver_build.build());
        
        await driver.get(`http://localhost:${get_config().serverPort}/chat/chat.html`);

        log.info("Chat's Frontend Initialized");
    }
}

export default ui_chat;
