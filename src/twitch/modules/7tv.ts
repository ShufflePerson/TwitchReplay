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
    }, resolve: Function, resolve_null_on_fail: boolean = false) {
        let emote = cached_emotes.find((emote: t_seventv_emote) => {
            if (identifier.id) {
                return emote.id == identifier.id;
            } else if (identifier.name) {
                return emote.name == identifier.name;
            }
        });

        if (emote) {
            resolve(emote);
        } else if (resolve_null_on_fail) {
            resolve(null);
        }
    }

    function add_cache_emote(emote: t_seventv_emote) {
        cached_emotes.push(emote);
    }

    export function get_global_emotes(): Promise<t_seventv_emote[]> {
        return new Promise(async (resolve, reject) => {
            let resp = await axios.get(endpoint + "emotes/global");
            let data = resp.data as t_seventv_emote[];
            resolve(data);

            data.forEach((emote: t_seventv_emote) => {
                add_cache_emote(emote);
            });
        })
    }

    export function get_channel_emotes(channel_id: string): Promise<t_seventv_emote[]> {
        return new Promise(async (resolve, reject) => {
            let resp = await axios.get(endpoint + `users/${channel_id}/emotes`);

            let data = resp.data as t_seventv_emote[];

            resolve(data);

            data.forEach((emote: t_seventv_emote) => {
                add_cache_emote(emote);
            })
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
            resolve_when_cached({ name: emote_name }, resolve, true)
        })
    }
}

export default seventv;