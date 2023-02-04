import { describe, expect, test } from '@jest/globals';

import { is_valid_config } from '../utils/is_valid_config';


describe("is_valid_config module", () => {
    test("Return true if the config is valid", () => {
        expect(is_valid_config({ targetDirectory: "" } as any)).toBe(false);
    })
    test("Return true if the config is valid", () => {
        expect(is_valid_config({
            targetUsername: "string",
            targetDirectory: "string",
            videoFormat: "mp4",
            serverPort: 3000
        })).toBe(true);
    })
})