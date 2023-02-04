import { t_asset } from "./t_asset";

interface t_message {
    sender: string;
    message: string;
    time: number;
    color: string;
    emotes: t_asset[];
    badges: t_asset[];
}

export { t_message }