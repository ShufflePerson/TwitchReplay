import { request, gql } from 'graphql-request'
import axios from 'axios';
import globals from './../globals';


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

    export async function set_playback_access_token(login: string = globals.channel_name, is_live: boolean = true, vod_id: string = "", is_vod: boolean = false, playerType: string = "site") {
        return new Promise(async (resolve, reject) => {
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

            resolve(0);
        })
    }

    export async function get_client_id(channel_name: string = globals.channel_name): Promise<string> {
        return new Promise(async (resolve, reject) => {
            if (globals['Client-ID']) return resolve(globals['Client-ID']);

            let data = await axios.get(`https://twitch.tv/${channel_name}`);
            let client_id = data.data.split('clientId="')[1].split('"')[0];

            globals['Client-ID'] = client_id;

            resolve(client_id);
        })
    }
}

export default client;