export interface t_chat_ui_message {
    text: string;
    username: string;
    color: string;
    emotes: {
        [key: string]: string;
    };
    badges: string[];
}