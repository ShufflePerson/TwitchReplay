import { keys } from 'ts-transformer-keys'


interface t_config {
    targetUsername: string,
    targetDirectory: string,
    recordLength: string,
    videoFormat: "mp4" | "avi" | "mkv",
    serverPort: number
}

export const tk_config: Array<keyof t_config> = ["targetUsername", "targetDirectory", "recordLength", "videoFormat", "serverPort"];

export { t_config }