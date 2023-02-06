import { t_message } from "../types/t_message";


export default function get_message_chunks(messages: t_message[], clip_start: number, clip_end: number): t_message[][] {
    const chunks: t_message[][] = [];
    let chunk: t_message[] = [];
    let chunk_start = clip_start;

    for (const message of messages) {
        if (message.time < clip_start || message.time > clip_end) {
            continue;
        }

        if (message.time > chunk_start + 2000 || message.time < chunk_start - 2000) {
            chunks.push(chunk);
            chunk = [];
            chunk_start = message.time;
        }

        chunk.push(message);
    }

    if (chunk.length > 0) {
        chunks.push(chunk);
    }


    return chunks;
}



