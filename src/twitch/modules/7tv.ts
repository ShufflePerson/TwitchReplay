import axios from "axios";
import logging from "../../logging/logging";
import { t_seventv_emote } from "../../types/t_seventv_emote";


let endpoint: string = "https://api.7tv.app/v2/";


namespace seventv {
    let logger = logging.get_logger().withContext("7tv");

    let cached_emotes: t_seventv_emote[] = [];
    let not_an_emote: string[] = [];
    
    function resolve_when_cached(identifier: {
        id?: string,
        name?: string
    }, resolve: Function) {
        let emote = cached_emotes.find((emote: t_seventv_emote) => {
            if (identifier.id) {
                return emote.id == identifier.id;
            } else if (identifier.name) {
                return emote.name == identifier.name;
            }
        });

        if (emote) {
            resolve(emote);
        }
    }

    function add_cache_emote(emote: t_seventv_emote) {
        cached_emotes.push(emote);
    }

    export function get_global_emotes(): Promise<t_seventv_emote> {
        return new Promise(async (resolve, reject) => {
            let resp = await axios.get(endpoint + "emotes/global");
            resolve(resp.data);
            add_cache_emote(resp.data)
        })
    }

    export function get_channel_emotes(channel_id: string): Promise<t_seventv_emote> {
        return new Promise(async (resolve, reject) => {
            resolve_when_cached({ id: channel_id }, resolve)
            let resp = await axios.get(endpoint + `channels/${channel_id}/emotes`);
            resolve(resp.data);
            add_cache_emote(resp.data)
        })
    }

    export function get_emote(emote_id: string): Promise<t_seventv_emote> {
        return new Promise(async (resolve, reject) => {
            resolve_when_cached({ id: emote_id }, resolve)
            let resp = await axios.get(endpoint + `emotes/${emote_id}`);
            resolve(resp.data);
        })
    }

    export function get_emote_by_name(emote_name: string): Promise<t_seventv_emote | null> {
        return new Promise(async (resolve, reject) => {
            logger.debug(`Getting emote by name ${emote_name}`)
            if (!not_an_emote.includes(emote_name)) {
                resolve(null);
            }
            try {
                resolve_when_cached({ name: emote_name }, resolve)
                let resp = await axios.get(endpoint + `emotes/name/${emote_name}`);
                resolve(resp.data);
                add_cache_emote(resp.data)
                logger.debug(`Got emote by name ${emote_name}`)
            } catch (ex) {
                logger.debug(`Failed to get emote by name ${emote_name}`)
                not_an_emote.push(emote_name);
            }

        })
    }
}

export default seventv;