import { randomUUID } from 'crypto';
import { appendFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import ws from 'ws';
import { t_message } from '../../types/t_message';
import { t_seventv_emote } from '../../types/t_seventv_emote';
import logging from './../../logging/logging';
import globals from './../globals';
import seventv from './7tv';
import client from './client';


namespace chat {

    let logger = logging.get_logger().withContext("chat");
    let socket: ws;
    let session_id: string = "";


    export function initlize(): Promise<boolean> {
        return new Promise(async (resolve, reject) => {

            logger.info("Initializing chat");
            initlize_folder();
            session_id = randomUUID(); 

            try {
                socket = new ws("wss://irc-ws.chat.twitch.tv:443");

                socket.on("open", () => {
                    logger.debug("Chat Websocket opened");

                    socket.send("CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership");
                    socket.send("PASS SCHMOOPIIE");
                    socket.send("NICK justinfan12345");
                    socket.send("JOIN #" + globals.channel_name);


                    resolve(true);
                });

                socket.on("message", (data) => {
                    let str_data = data.toString();

                    let is_chat_message = str_data.startsWith("@badge-info");
                    if (is_chat_message) {
                        let chat_message = str_data.split("PRIVMSG #" + globals.channel_name + " :")[1];
                        let emotes = str_data.split("emotes=")[1].split(";")[0].split("/");
                        let emote_ids = emotes.map((emote) => {
                            return emote.split(":")[0];
                        });

                        let emote_names = emotes.map((emote) => {
                            return emote.split(":")[1];
                        });

                        let badges = str_data.split("badges=")[1].split(";")[0].split(",");
                        let badge_names = badges.map((badge) => {
                            return badge.split("/")[0];
                        });

                        let parsed_message: t_message = {
                            sender: str_data.split("display-name=")[1].split(";")[0],
                            emote_ids: emote_ids,
                            emote_names: emote_names,
                            badge_names: badge_names,
                            message: chat_message.replace(/(\r\n|\n|\r)/gm, "")
                        }

                        handle_chat_message(parsed_message);
                        

                    }
                });

                socket.on("error", (error) => {
                    logger.error(error);
                });

                socket.on("close", (code, reason) => {
                    logger.info(`Chat closed with code ${code} and reason ${reason}`);
                });
            } catch (ex) {
                logger.error(ex);
                resolve(false);
            }
        })
    }
    
    function initlize_folder() {
        logger.info("Initializing Chat Folders")
        if (!existsSync("./cache"))
            mkdirSync("./cache");
        if(!existsSync("./cache/chat")) 
            mkdirSync("./cache/chat");

        logger.info("Chat Folders Initialized")
    }

    async function handle_chat_message(message: t_message) {
        let current_date = new Date();


        if(!existsSync(`./cache/chat/${session_id}.txt`)) {
            let stream_title = await client.get_stream_title();
            let streamer_name = globals.channel_name; 

            let file_data = `#Session ID: ${session_id}\n#Stream Title: ${stream_title}\n#Streamer Name: ${streamer_name}\n\n`;
            file_data += `#Time,Sender,Message,Emotes,EmoteIDs,Badges\n`;

            writeFileSync(`./cache/chat/${session_id}.txt`, file_data);
        } else {
            let file_data = `${current_date.getHours()}:${current_date.getMinutes()}:${current_date.getSeconds()},${message.sender},${message.message},${message.emote_names},${message.emote_ids},${message.badge_names}\n`;
            appendFileSync(`./cache/chat/${session_id}.txt`, file_data, {flag: "a"});
        }


        let words = message.message.split(" ");
        words = words.filter((word) => {
            return !message.emote_names.includes(word);
        });
        
        for (let word of words) {
            let data: t_seventv_emote | null = await seventv.get_emote_by_name(word);
            if (data != null) {
                console.log(data);
            }
        }
        

    }
}

export default chat;