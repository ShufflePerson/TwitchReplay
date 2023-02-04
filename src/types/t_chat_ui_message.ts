import { t_emotes } from "./t_emotes";

export interface t_chat_ui_message {
    text: string;
    username: string;
    color: string;
    emotes: t_emotes,
    badges: string[];
}