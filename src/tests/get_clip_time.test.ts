import { describe, expect, test } from '@jest/globals';

import { get_clip_time } from '../utils/get_clip_time';

describe("get_clip_time module", () => {
    test("Return the Clip Buffer Time in Milliseconds", () => {
        expect(get_clip_time({ recordLength: "12:53:52" })).toBe(46432000);
    });
    test("Fix padding and return the Clip Buffer time in Milliseconds", () => {
        expect(get_clip_time({ recordLength: "0:0:1" })).toBe(1000);
    });
})