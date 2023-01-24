import { request, gql } from 'graphql-request'
import axios from 'axios';
import globals from './../globals';
import logging from '../../logging/logging';
import cap_text from '../../utils/cap_text';



import { Curl } from 'node-libcurl';
const curl = new Curl();


//#region GraphQL Query

const graph_gql_query = gql`
    query PlaybackAccessToken_Template(
    $login: String!
    $isLive: Boolean!
    $vodID: ID!
    $isVod: Boolean!
    $playerType: String!
    ) {
    streamPlaybackAccessToken(
        channelName: $login
        params: {
        platform: "web"
        playerBackend: "mediaplayer"
        playerType: $playerType
        }
    ) @include(if: $isLive) {
        value
        signature
        __typename
    }
    videoPlaybackAccessToken(
        id: $vodID
        params: {
        platform: "web"
        playerBackend: "mediaplayer"
        playerType: $playerType
        }
    ) @include(if: $isVod) {
        value
        signature
        __typename
    }
    }
`

//#endregion

namespace client {

    const log = logging.get_logger().withContext("client");


    export async function set_playback_access_token(login: string = globals.channel_name, is_live: boolean = true, vod_id: string = "", is_vod: boolean = false, playerType: string = "site") {
        return new Promise(async (resolve, reject) => {
            log.debug(`Setting playback access token for ${login}`);

            let data: {
                streamPlaybackAccessToken: {
                    value: string,
                    signature: string
                }
            };

            try {
                data = await request('https://gql.twitch.tv/gql', graph_gql_query, {
                    login,
                    isLive: is_live,
                    vodID: vod_id,
                    isVod: is_vod,
                    playerType
                }, {
                    "Client-ID": await get_client_id(),
                })
            } catch (ex) {
                log.error("Streamer is most likely offline.")
                log.error(ex);
                return reject(ex);
            }
            globals.token = data.streamPlaybackAccessToken.value;
            globals.signature = data.streamPlaybackAccessToken.signature;
            globals.channel_id = JSON.parse(data.streamPlaybackAccessToken.value).channel_id;

            log.debug(`Set playback access token for ${login} and signature to ${globals.signature} and channel id to ${globals.channel_id}`)

            resolve(0);
        })
    }

    export async function get_client_id(channel_name: string = globals.channel_name): Promise<string> {
        return new Promise(async (resolve, reject) => {
            if (globals['Client-ID']) return resolve(globals['Client-ID']);

            log.debug(`Getting client id`)

            let data = await axios.get(`https://twitch.tv/${channel_name}`);
            let client_id = data.data.split('clientId="')[1].split('"')[0];

            globals['Client-ID'] = client_id;

            log.debug(`Got client id and set it to ${client_id}`)

            resolve(client_id);
        })
    }


    export function get_device_id(channel_name: string = globals.channel_name): Promise<string> {
        return new Promise(async (resolve, reject) => {

            log.debug(`Getting device id`)

            curl.setOpt(Curl.option.URL, `https://twitch.tv/${channel_name}`);
            curl.setOpt(Curl.option.FOLLOWLOCATION, true);
            curl.setOpt(Curl.option.SSL_VERIFYPEER, false);

            curl.on('end', async (statusCode, body, headers) =>
            { 
                let set_cookies = headers[1]["Set-Cookie"];

                let unique_id = "DEVICE_ID";
                for (let i = 0; i < set_cookies.length; i++) {
                    if (set_cookies[i].includes("unique_id")) {
                        unique_id = set_cookies[i].split("unique_id=")[1].split(";")[0];
                        break;
                    } if (set_cookies[i].includes("server_session_id")) {
                        globals['Server-Session'] = set_cookies[i].split("server_session_id=")[1].split(";")[0];
                    }
                }

                if (unique_id == undefined) {
                    log.error(`Failed to get device id`);

                    return reject("Failed to get device id");
                }

                globals['Device-ID'] = unique_id;
                resolve(unique_id);
            });


            curl.on('error', ((err, data) => {
                console.log(err);
            }));
            curl.perform();
        });
    }

    export async function get_stream_title(channel_name: string = globals.channel_name): Promise<string> {
        return new Promise(async (resolve, reject) => {
            log.debug(`Getting stream title`)

            let data = await axios.get(`https://twitch.tv/${channel_name}`);

            try {
                let title = data.data.split('"description":"')[1].split('"')[0];

                log.debug(`Got stream title and set it to ${cap_text(title)}`)

                resolve(title);
            } catch (ex) {
                console.log(data);
                log.error(`Failed to get stream title`);

                reject(ex);
            }

        })
    }


    export function get_basic_playlist_url(channel_name: string = globals.channel_name): string {
        return `https://usher.ttvnw.net/api/channel/hls/${channel_name}.m3u8?allow_source=true&sig=${globals.signature}&token=${globals.token}`
    }

    export function get_full_playlist_url(channel_name: string = globals.channel_name): Promise<string> {
        return new Promise(async (resolve, reject) => {
            log.debug(`Getting full playlist url`)

            let resp = await axios.get(get_basic_playlist_url(channel_name));
            let playlist_url = resp.data.split("\n").filter((line: string) => !line.startsWith("#"))[0];

            log.debug(`Got full playlist url`)

            resolve(playlist_url);
        })
    }

}

export default client;