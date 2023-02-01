# Twitch Replay

Similar to OBS Replay Buffer but for Twitch.

To understand about the Twitch frontend API and how to use it, check out [notes.md](notes.MD).

## Todo

- [x] Implement Chat functionality
  - [x] Get Current Chat
  - [x] Keep Chat in sync and saved in a efficient way
- [x] Blend Chat & Video
  - [x] A frontend for the Chat
  - [x] A way to export the frontend of the chat with the video
- [x] Implement a UI

## Features

- Automatically record the last `x` minutes of your stream, `x` being the number you set in the config.
- Automatically syncs and adds chat replay to the video.
- Exports video in chosen format (mp4, mkv, webm, etc.)

## Requirements

- [Node.js](https://nodejs.org/en/download/)
- [FFmpeg](https://www.gyan.dev/ffmpeg/builds/)
- [Chrome WebDriver](https://chromedriver.chromium.org/downloads) 

## Installation

- Download the latest release from [here](/releases) and extract it.
- Open `config.json` and edit the following settings to your liking
  - `targetUsername`: The username of the channel you want to record.
  - `targetDirectory`: The directory where the video will be saved.
  - `recordLength`: The length of the video in the following format: `hh:mm:ss`.
  - `videoFormat`: The format of the video. (mp4, mkv, webm, etc.)
  - `serverPort`: The port the server will run on.

## Usage

- Run `start.bat` to start the server. (You can also run `npm run run` in the command line / terminal)
- When you wanna save a clip, simply press "Save" on the GUI and the video will be saved in the directory you specified in the config.
- If you wish to implement a custom solution to saving the clip, simply do a POST request to `http://x.x.x.x/api/clip` where `x.x.x.x` is the IP of the server. (You can also use `localhost` if you're running the server on the same machine as the client)

## Notes

- `TwitchClipper` starts recording as soon as you start the server.

## Credits

Developed by `Shuffle#4696`
Funded by `Arthium#3771`
