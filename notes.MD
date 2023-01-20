# Twitch unofficial Frontend API documention

## What is the differnce between the official REST and "un-official" frontend API?

The official API is a REST API made to be used by custom programs and apps, it requires a oauth key and is of-course tracked.

The "un-official" API is a API used by their frontend, when the page loads, to fetch information and the stream itself.

It was never designed or meant to be used by custom programs and apps. Up side is that you do not need a OAuth key for it, hence cannot be tracked or rate limited. Down side is that it is not documented and can change at any time and is hard to use.

### Capturing the `PlaybackAccessToken`

GET request to `https://gql.twitch.tv/gql`

Query for GraphQL is the following:
`query PlaybackAccessToken_Template($login: String!, $isLive: Boolean!, $vodID: ID!, $isVod: Boolean!, $playerType: String!) {  streamPlaybackAccessToken(channelName: $login, params: {platform: "web", playerBackend: "mediaplayer", playerType: $playerType}) @include(if: $isLive) {    value    signature    __typename  }  videoPlaybackAccessToken(id: $vodID, params: {platform: "web", playerBackend: "mediaplayer", playerType: $playerType}) @include(if: $isVod) {    value    signature    __typename  }}`

`Device-ID` is under (data.streamPlaybackAccessToken.value).device_id

Response:

```json
{
  "data": {
    "streamPlaybackAccessToken": {
      "value": "{\"adblock\":false,\"authorization\":{\"forbidden\":false,\"reason\":\"\"},\"blackout_enabled\":false,\"channel\":\"hjune\",\"channel_id\":121111915,\"chansub\":{\"restricted_bitrates\":[],\"view_until\":1924905600},\"ci_gb\":false,\"geoblock_reason\":\"\",\"device_id\":\"na9zZ4lhpN8jLn6KyShSaFAl4MZUq2ub\",\"expires\":1674006163,\"extended_history_allowed\":false,\"game\":\"\",\"hide_ads\":false,\"https_required\":true,\"mature\":false,\"partner\":false,\"platform\":\"web\",\"player_type\":\"site\",\"private\":{\"allowed_to_view\":true},\"privileged\":false,\"role\":\"\",\"server_ads\":true,\"show_ads\":true,\"subscriber\":false,\"turbo\":false,\"user_id\":null,\"user_ip\":\"82.253.80.125\",\"version\":2}",
      "signature": "252d0602704d2c1a27194a6d2f52d9106bf03b12",
      "__typename": "PlaybackAccessToken"
    }
  },
  "extensions": {
    "durationMilliseconds": 60,
    "operationName": "PlaybackAccessToken_Template",
    "requestID": "01GQ17H83ZD9MKYGSHKQWMJG29"
  }
}
```

### Capturing the `Device-ID`

Returned in the `PlaybackAccessToken` response, it looks like this: `na9zZ4lhpN8jLn6KyShSaFAl4MZUq2ub`

### Capturing the `Client-ID`

GET Request to `https://twitch.tv/NAME_OF_CHANNEL`

Parse left dilimiter `clientId="` and right delimiter `"`

Client-ID looks like this: `kimne78kx3ncx6brgo4mv6wki5h1ko`

## Endpoints

Endpoints are the URLs that you can send requests to, they are used to fetch information about the stream, the user watching, the chat, etc.

### `gql.twitch.tv/gql`

This is the endpoint for the GraphQL API, it is used to fetch information about the user watching, the stream, the chat, etc.

Response and request format is JSON.

### https://usher.ttvnw.net/api/channel/hls/CHANNEL_NAME.m3u8

This is the endpoint for the HLS API, it is used to fetch the stream video m38u file.

To simulate the query, we only have to focus on two query parameters, `token` and `sig`. And these are already in the `PlaybackAccessToken` response.

"play_session_id" is a random string, it can be anything.

In the end, the only query parameters that we need to provide are: `allow_source`, `sig` and `token`. The rest are optional.

Query:

```
acmb: e30=
allow_source: true
fast_bread: true
p: 7740222
play_session_id: fdce79578607c1d77bf4ab4dccdc35bc
player_backend: mediaplayer
playlist_include_framerate: true
reassignments_supported: true
sig: 765c2e1e153b4b6528f6c50ffd248876205fa02d
supported_codecs: avc1
token: {"adblock":false,"authorization":{"forbidden":false,"reason":""},"blackout_enabled":false,"channel":"xqc","channel_id":71092938,"chansub":{"restricted_bitrates":[],"view_until":1924905600},"ci_gb":false,"geoblock_reason":"","device_id":"WQHrRAnBXWp5DBBiF4fg1p2qm2Gw8ENp","expires":1674221688,"extended_history_allowed":false,"game":"","hide_ads":false,"https_required":true,"mature":false,"partner":false,"platform":"web","player_type":"site","private":{"allowed_to_view":true},"privileged":false,"role":"","server_ads":true,"show_ads":true,"subscriber":false,"turbo":false,"user_id":null,"user_ip":"82.103.181.178","version":2}
cdm: wv
player_version: 1.17.0
```

### `wss://pubsub-edge.twitch.tv/v1`

This is the endpoint for the WebSocket API.

There are only 5 request types, `PING`, `PONG`, `LISTEN`, `RESPONSE`, `MESSAGE`.

#### PING

Ping has no other data than the type, it is used to keep the connection alive and check if it is still alive.

Example:

```json
{
  "type": "PING"
}
```

#### PONG

Pong is only sent by the server, it is used to respond to a ping.

Example:

```json
{
  "type": "PONG"
}
```

#### LISTEN

Listen is sent by the client to subscribe to a topic. The `data` object contains a `topics` array, which contains the topics to subscribe to.

Example:

```json
{
  "type": "LISTEN",
  "nonce": "a2f7iPvK3hYaCfejZ0KB1qhvDCLP3U",
  "data": {
    "topics": ["guest-star-channel-v1.121111915"]
  }
}
```

#### RESPONSE

Response contains 2 fields, `error` and `nonce`. `error` is a string containing the error message if any are present, `nonce` is the nonce of the request that caused the error.

Example:

```json
{
  "type": "RESPONSE",
  "error": "ERR_BADMESSAGE",
  "nonce": "a2f7iPvK3hYaCfejZ0KB1qhvDCLP3U"
}
```

#### MESSAGE

Message is sent by the server when a update has occured, the data object contains a `topic` and a `message` field. `topic` is the topic that was subscribed to, `message` is the response/updated data for that topic.

Example:

```
{
    "type":"MESSAGE",
    "data":{
        "topic":"video-playback-by-id.121111915",
        "message": "{\"type\":\"viewcount\",\"server_time\":1674003750.376601,\"viewers\":40215}"
    }
}
`
```
