

interface t_seventv_emote {
    id: string;
    name: string;
    owner: {
        id: string;
        twitch_id: string;
        login: string;
        display_name: string;
        role: {
            id: string;
            name: string;
            position: number;
            color: number;
            allowed: number;
            denied: number;
        }
    }
    visibility: number;
    visibility_simple: string[];
    mime: string;
    status: number;
    tags: string[];
    width: number[];
    height: number[];
    urls: string[][];
}

export { t_seventv_emote }
