import { randomUUID } from 'crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import ws from 'ws';
import { e_asset } from '../../enums/e_asset';
import { t_message } from '../../types/t_message';
import { t_saved_chat } from '../../types/t_saved_chat';
import { t_seventv_emote } from '../../types/t_seventv_emote';
import is_dev from '../../utils/is_dev';
import logging from './../../logging/logging';
import globals from './../globals';
import seventv from './7tv';
import client from './client';


namespace chat {

    let logger = logging.get_logger().withContext("chat");
    let socket: ws;
    let session_id: string = "";
    let channel_emotes: t_seventv_emote[] = [];
    let global_emotes: t_seventv_emote[] = [];
    export let saved_chat: t_saved_chat = {
        channel_name: globals.channel_name,
        title: "",
        messages: []
    };


    export function initlize(): Promise<boolean> {
        return new Promise(async (resolve, reject) => {

            logger.info("Initializing chat");
            initlize_folder();
            session_id = randomUUID();

            saved_chat.channel_name = globals.channel_name;
            saved_chat.title = await client.get_stream_title();
            saved_chat.messages = [];

            channel_emotes = await seventv.get_channel_emotes(globals.channel_id.toString());
            global_emotes = await seventv.get_global_emotes();

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

                        if (!chat_message) {
                            return logger.warning("Chat message parsing failed. Raw: " + str_data);
                        }

                        let parsed_message: t_message = {
                            sender: str_data.split("display-name=")[1].split(";")[0],
                            message: chat_message.replace(/(\r\n|\n|\r)/gm, ""),
                            emotes: [],
                            badges: [],
                            color: str_data.split("color=")[1].split(";")[0],
                            time: Date.now()

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

    async function initlize_folder() {
        logger.info("Initializing Chat Folders")
        if (!existsSync("./cache"))
            mkdirSync("./cache");
        if (!existsSync("./cache/chat"))
            mkdirSync("./cache/chat");

        logger.info("Chat Folders Initialized")
    }

    async function handle_chat_message(message: t_message) {
        let message_words = message.message.split(" ");

        for (let i = 0; i < message_words.length; i++) {
            let word = message_words[i];
            //get emote 
            let emote = channel_emotes.find((emote) => {
                return emote.name == word;
            });

            if (!emote) {
                emote = global_emotes.find((emote) => {
                    return emote.name == word;
                });
            }

            if (!emote) {
                emote = await seventv.get_emote_by_name(word);
            }

            if (emote) {
                let url_options = emote.urls;
                let url: string = url_options[1][1];
                message.emotes.push({
                    name: emote.name,
                    url: url,
                    type: e_asset.emote
                });
            } else {
                //logger.error("Could not find emote " + word)
            }
        }

        saved_chat.messages.push(message);

        if (is_dev())
            save_chat();
    }

    function sanitize_message(message: t_message): t_message {
        let sanitized_message = message;

        sanitized_message.message = sanitized_message.message.replace(/\|/g, "I");


        return sanitized_message;

    }

    export function save_chat() {
        let data: string = "";

        let messages = saved_chat.messages;
        for (let i = 0; i < messages.length; i++) {
            let message = messages[i];
            message = sanitize_message(message);

            data += `${message.sender}|${message.time}|${message.message}|${message.color}|${message.badges}|${message.emotes}`;
            data += "\n";
        }

        writeFileSync(`./cache/chat/${session_id}.chat`, data);
    }

    export function delete_chat_before(time: number) {
        let messages = saved_chat.messages;
        let new_messages: t_message[] = [];

        for (let i = 0; i < messages.length; i++) {
            let message = messages[i];
            if (message.time > time) {
                new_messages.push(message);
            }
        }

        saved_chat.messages = new_messages;

    }


    export function load_saved_chat(file_path: string): t_saved_chat {
        let raw_message = readFileSync(file_path);
        let raw_messages = raw_message.toString().split("\n");

        let messages: t_message[] = [];

        for (let i = 0; i < raw_messages.length; i++) {
            let raw_message = raw_messages[i];
            let message_parts = raw_message.split("|");

            let message: t_message = {
                sender: message_parts[0],
                time: parseInt(message_parts[1]),
                message: message_parts[2],
                color: message_parts[3],
                badges: [],
                emotes: []
            }

            messages.push(message);
        }

        let saved_chat: t_saved_chat = {
            channel_name: globals.channel_name,
            title: "",
            messages: messages
        }

        return saved_chat;
    }
}

export default chat;