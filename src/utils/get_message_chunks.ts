import { t_message } from "../types/t_message";



export default ((messages: t_message[], messages_per_chunk: number = 5): t_message[][] => {
    let chunks: t_message[][] = [];
    let current_chunk: t_message[] = [];

    for (let i = 0; i < messages.length; i++) {
        if (current_chunk.length >= messages_per_chunk) {
            chunks.push(current_chunk);
            current_chunk = [];
        }
        current_chunk.push(messages[i]);
    }

    if (current_chunk.length > 0) {
        chunks.push(current_chunk);
    }

    return chunks;
})