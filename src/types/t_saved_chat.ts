import { t_message } from "./t_message";



export interface t_saved_chat {
    channel_name: string;
    title: string;
    messages: t_message[];
}