import { t_asset } from "../types/t_asset";
import { t_emotes } from "../types/t_emotes";

export function get_emotes_in_obj({ old_emotes }: { old_emotes: t_asset[]; }): t_emotes {
    let new_emotes: t_emotes = {};
    old_emotes.forEach((emote: t_asset): void => {
        new_emotes[emote.name] = emote.url;
    });

    return new_emotes;
}
