import { keys } from 'ts-transformer-keys'


interface t_config {
    targetUsername: string,
    targetDirectory: string,
    videoFormat: "mp4" | "avi" | "mkv",
    serverPort: number
}

export const tk_config: Array<keyof t_config> = ["targetUsername", "targetDirectory", "videoFormat", "serverPort"];

export { t_config }