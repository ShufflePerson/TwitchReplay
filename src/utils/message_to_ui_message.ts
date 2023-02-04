import { t_chat_ui_message } from "../types/t_chat_ui_message";
import { t_emotes } from "../types/t_emotes";
import { t_message } from "../types/t_message";
import { get_emotes_in_obj } from "./get_emotes_in_obj";



export default ((message: t_message): t_chat_ui_message => {
    let ui_message: t_chat_ui_message = {
        text: message.message,
        username: message.sender,
        color: message.color,
        emotes: get_emotes_in_obj({ old_emotes: message.emotes }),
        badges: message.badges.map((badge): string => {
            return badge.url;
        })
    };

    return ui_message;
})
