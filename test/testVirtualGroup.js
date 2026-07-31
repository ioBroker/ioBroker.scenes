'use strict';
const assert = require('node:assert');

/**
 * Unit test for virtual group aggregation logic.
 * Tests the fix for https://github.com/ioBroker/ioBroker.scenes/issues/456
 * where `member.actual || null` incorrectly treated `false` and `0` as null.
 */

/**
 * Simulates the virtual group activeValue computation from checkScene().
 * This mirrors the logic in src/main.ts lines ~373-410.
 */
function computeVirtualGroupValue(members, aggregation) {
    let activeValue = null;
    let avgCounter = 0;

    for (const member of members) {
        if (activeValue === 'uncertain') {
            continue;
        }

        if (activeValue === null) {
            // This is the line that was fixed: `member.actual || null` -> `member.actual ?? null`
            activeValue = member.actual ?? null;
        } else {
            if (activeValue != member.actual) {
                if (aggregation === undefined || aggregation === 'uncertain') {
                    activeValue = 'uncertain';
                } else {
                    if (aggregation === 'any') {
                        activeValue = activeValue || (member.actual === undefined ? null : member.actual);
                    } else if (aggregation === 'min') {
                        activeValue = Math.min(activeValue, parseFloat(member.actual) || 0);
                    } else if (aggregation === 'max') {
                        activeValue = Math.max(activeValue, parseFloat(member.actual) || 0);
                    } else if (aggregation === 'avg') {
                        activeValue = parseFloat(activeValue) + (parseFloat(member.actual) || 0);
                        avgCounter++;
                    }
                }
            } else if (aggregation === 'avg') {
                activeValue = parseFloat(activeValue) + (parseFloat(member.actual) || 0);
                avgCounter++;
            }
        }
    }

    if (aggregation === 'avg' && avgCounter) {
        activeValue = (parseFloat(activeValue) || 0) / (avgCounter + 1);
    }

    return activeValue;
}

describe('Virtual group aggregation', function () {
    describe('Issue #456: false values must not be treated as null', function () {
        it('should return false when all members are false', function () {
            const members = [
                { actual: false },
                { actual: false },
                { actual: false },
            ];
            const result = computeVirtualGroupValue(members, undefined);
            assert.strictEqual(result, false);
        });

        it('should return 0 when all members are 0', function () {
            const members = [
                { actual: 0 },
                { actual: 0 },
                { actual: 0 },
            ];
            const result = computeVirtualGroupValue(members, undefined);
            assert.strictEqual(result, 0);
        });

        it('should return false with "any" aggregation when all members are false', function () {
            const members = [
                { actual: false },
                { actual: false },
                { actual: false },
            ];
            const result = computeVirtualGroupValue(members, 'any');
            assert.strictEqual(result, false);
        });

        it('should return true with "any" aggregation when at least one member is true', function () {
            const members = [
                { actual: false },
                { actual: true },
                { actual: false },
            ];
            const result = computeVirtualGroupValue(members, 'any');
            assert.strictEqual(result, true);
        });
    });

    describe('Basic aggregation modes', function () {
        it('should return "uncertain" when members differ with default aggregation', function () {
            const members = [
                { actual: true },
                { actual: false },
            ];
            const result = computeVirtualGroupValue(members, undefined);
            assert.strictEqual(result, 'uncertain');
        });

        it('should compute min correctly', function () {
            const members = [
                { actual: 10 },
                { actual: 5 },
                { actual: 20 },
            ];
            const result = computeVirtualGroupValue(members, 'min');
            assert.strictEqual(result, 5);
        });

        it('should compute max correctly', function () {
            const members = [
                { actual: 10 },
                { actual: 5 },
                { actual: 20 },
            ];
            const result = computeVirtualGroupValue(members, 'max');
            assert.strictEqual(result, 20);
        });

        it('should compute avg correctly', function () {
            const members = [
                { actual: 10 },
                { actual: 20 },
                { actual: 30 },
            ];
            const result = computeVirtualGroupValue(members, 'avg');
            assert.strictEqual(result, 20);
        });

        it('should return null when all members have null/undefined actual', function () {
            const members = [
                { actual: null },
                { actual: null },
            ];
            const result = computeVirtualGroupValue(members, undefined);
            assert.strictEqual(result, null);
        });
    });
});
