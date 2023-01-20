import { request, gql } from 'graphql-request'
import axios from 'axios';
import globals from './../globals';
import logging from '../../logging/logging';
import cap_text from '../../utils/cap_text';


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
            const data = await request('https://gql.twitch.tv/gql', graph_gql_query, {
                login,
                isLive: is_live,
                vodID: vod_id,
                isVod: is_vod,
                playerType
            }, {
                "Client-ID": await get_client_id(),
            })
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

    export async function get_device_id(channel_name: string = globals.channel_name): Promise<string> {
        return new Promise(async (resolve, reject) => {
            if (globals['Device-ID']) return resolve(globals['Device-ID']);

            log.debug(`Getting device id`)

            let resp = await axios.get(`https://twitch.tv/${channel_name}`);

            let set_cookies = resp.headers['set-cookie'];
            let unique_id = "DEVICE_ID";
            for (let i = 0; i < set_cookies.length; i++) {
                if (set_cookies[i].includes("unique_id")) {
                    unique_id = set_cookies[i];
                    break;
                }
            }

            unique_id = unique_id.split("unique_id=")[1];
            if (unique_id == undefined) {
                log.error(`Failed to get device id`);
                
                return reject("Failed to get device id");
            }

            globals['Device-ID'] = unique_id;

            log.debug(`Got device id and set it to ${unique_id}`)


            resolve(unique_id);
        })
    }

    export async function get_stream_title(channel_name: string = globals.channel_name): Promise<string> {
        return new Promise(async (resolve, reject) => {
            log.debug(`Getting stream title`)

            let data = await axios.get(`https://twitch.tv/${channel_name}`);

            try {
                let title = data.data.split('property="og:description" content="')[1].split('"')[0];

                log.debug(`Got stream title and set it to ${cap_text(title)}`)

                resolve(title);
            } catch (ex) {
                console.log(data);
                log.error(`Failed to get stream title`);

                reject(ex);
            }

        })
    }

}

export default client;