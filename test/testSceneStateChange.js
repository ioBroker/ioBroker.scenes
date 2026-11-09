'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const vm = require('node:vm');

function createAdapter() {
    const filename = require.resolve('../build/main.js');
    const load = createRequire(filename);
    const adapterModule = { exports: {} };
    // Replace only the controller connection; execute the actual built adapter and registered handler.
    vm.runInNewContext(
        fs.readFileSync(filename, 'utf8'),
        {
            module: adapterModule,
            exports: adapterModule.exports,
            __filename: filename,
            __dirname: path.dirname(filename),
            setTimeout,
            clearTimeout,
            require: id =>
                id === '@iobroker/adapter-core'
                    ? {
                          Adapter: class {
                              constructor(options) {
                                  this.handlers = options;
                              }
                          },
                      }
                    : load(id),
        },
        { filename },
    );
    return adapterModule.exports();
}

describe('Scene state commands (issue #475)', function () {
    const sceneId = 'scene.0.sockets';
    let adapter;
    let activations;

    beforeEach(function () {
        adapter = createAdapter();
        adapter.scenes[sceneId] = { native: { virtualGroup: false, onFalse: { enabled: true } } };
        activations = [];
        adapter.activateScene = (id, value) => activations.push({ id, value });
    });

    for (const [input, expected] of [
        [false, false],
        ['false', false],
        ['FALSE', false],
        ['False', false],
        ['fAlSe', false],
        [true, true],
        ['true', true],
        ['TRUE', true],
        ['TrUe', true],
        [0, false],
        ['0', false],
        [1, true],
        [42, true],
        ['other', true],
        ['', false],
        [null, false],
    ]) {
        it(`activates ${expected} for ${JSON.stringify(input)} (${typeof input})`, function () {
            adapter.handlers.stateChange(sceneId, { val: input, ack: false });
            assert.deepEqual(activations, [{ id: sceneId, value: expected }]);
        });
    }

    it('does not activate a scene for an acknowledged update', function () {
        adapter.handlers.stateChange(sceneId, { val: 'FALSE', ack: true });
        assert.deepEqual(activations, []);
    });

    it('does not execute FALSE when the scene has no FALSE action', function () {
        adapter.scenes[sceneId].native.onFalse.enabled = false;
        adapter.handlers.stateChange(sceneId, { val: 'FALSE', ack: false });
        assert.deepEqual(activations, []);
    });

    for (const input of ['FALSE', 'False', 0, 42]) {
        it(`preserves the raw virtual group value ${JSON.stringify(input)}`, function () {
            adapter.scenes[sceneId].native.virtualGroup = true;
            adapter.handlers.stateChange(sceneId, { val: input, ack: false });
            assert.deepEqual(activations, [{ id: sceneId, value: input }]);
        });
    }
});

describe('Scene status with nested scenes (issue #475)', function () {
    const sceneId = 'scene.0.all';
    const childId = 'scene.0.sockets';
    let adapter;
    let written;

    function createScene(setIfTrue, setIfFalse) {
        adapter = createAdapter();
        adapter.scenes[sceneId] = {
            native: {
                virtualGroup: false,
                onFalse: { enabled: true },
                members: [{ id: childId, setIfTrue, setIfFalse }],
            },
        };
        adapter.sceneValue[sceneId] = { val: null, ack: false };
        written = [];
        adapter.setForeignStateAsync = async (id, val, ack) => written.push({ id, val, ack });
    }

    async function checkScene(actual) {
        adapter.checkScene(sceneId, childId, { val: actual, ack: true });
        // checkScene evaluates the members after 200 ms
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    for (const [setIfTrue, setIfFalse] of [
        [true, false],
        ['TRUE', 'FALSE'],
        ['true', 'false'],
        ['True', 'False'],
    ]) {
        it(`reports false when the nested scene is false (${JSON.stringify(setIfFalse)})`, async function () {
            createScene(setIfTrue, setIfFalse);
            await checkScene(false);
            assert.deepEqual(written, [{ id: sceneId, val: false, ack: true }]);
        });

        it(`reports true when the nested scene is true (${JSON.stringify(setIfTrue)})`, async function () {
            createScene(setIfTrue, setIfFalse);
            await checkScene(true);
            assert.deepEqual(written, [{ id: sceneId, val: true, ack: true }]);
        });
    }

    it('reports uncertain when the nested scene is uncertain', async function () {
        createScene('TRUE', 'FALSE');
        await checkScene('uncertain');
        assert.deepEqual(written, [{ id: sceneId, val: 'uncertain', ack: true }]);
    });
});

describe('Scene status if members match TRUE and FALSE (issue #267)', function () {
    const sceneId = 'scene.0.printer';
    const memberId = 'sonoff.0.POWER1';
    let adapter;
    let written;

    function createScene(currentValue) {
        adapter = createAdapter();
        adapter.scenes[sceneId] = {
            native: {
                virtualGroup: false,
                onFalse: { enabled: true },
                // switch the printer off by TRUE, do not change it by FALSE
                members: [{ id: memberId, setIfTrue: false, setIfFalse: null }],
            },
        };
        adapter.sceneValue[sceneId] = { val: currentValue, ack: true };
        written = [];
        adapter.setForeignStateAsync = async (id, val, ack) => written.push({ id, val, ack });
    }

    async function checkScene(actual) {
        adapter.checkScene(sceneId, memberId, { val: actual, ack: true });
        // checkScene evaluates the members after 200 ms
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    it('keeps false, if the member matches TRUE and FALSE', async function () {
        createScene(false);
        await checkScene(false);
        assert.deepEqual(written, []);
    });

    it('keeps true, if the member matches TRUE and FALSE', async function () {
        createScene(true);
        await checkScene(false);
        assert.deepEqual(written, []);
    });

    it('reports false, if the member matches only FALSE', async function () {
        createScene(true);
        await checkScene(true);
        assert.deepEqual(written, [{ id: sceneId, val: false, ack: true }]);
    });

    it('reports true, if the scene value is unknown and the member matches TRUE', async function () {
        createScene(null);
        await checkScene(false);
        assert.deepEqual(written, [{ id: sceneId, val: true, ack: true }]);
    });
});

describe('Stop a running scene (issue #42)', function () {
    const sceneId = 'scene.0.lawn';
    const otherSceneId = 'scene.0.lawn_2';
    let adapter;
    let written;

    function createScene(id, native) {
        adapter.scenes[id] = {
            native: { virtualGroup: false, onFalse: { enabled: false }, burstInterval: 0, ...native },
        };
        adapter.sceneValue[id] = { val: false, ack: true };
    }

    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    beforeEach(function () {
        adapter = createAdapter();
        adapter.log = { debug() {}, info() {}, warn() {}, error() {} };
        written = [];
        adapter.setForeignState = (id, val, ack) => written.push({ id, val, ack: !!ack });
        adapter.setForeignStateAsync = async (id, val, ack) => written.push({ id, val, ack: !!ack });
        createScene(sceneId, {
            members: [
                { id: 'valve.1', setIfTrue: true, delay: 0 },
                { id: 'valve.1', setIfTrue: false, delay: 200 },
                { id: 'valve.2', setIfTrue: true, delay: 200 },
            ],
        });
        // the ID starts with the ID of the first scene, but must not be stopped
        createScene(otherSceneId, { members: [{ id: 'valve.3', setIfTrue: true, delay: 200 }] });
    });

    it('cancels the delayed commands of the scene only', async function () {
        adapter.activateScene(sceneId, true);
        adapter.activateScene(otherSceneId, true);
        await wait(50);
        assert.equal(adapter.stopScene(sceneId), 2);
        await wait(300);
        assert.deepEqual(
            written.filter(item => !item.id.startsWith('scene.')),
            [
                { id: 'valve.1', val: true, ack: false },
                { id: 'valve.3', val: true, ack: false },
            ],
        );
    });

    it('cancels the commands waiting for the burst interval', async function () {
        createScene(sceneId, {
            burstInterval: 100,
            members: [
                { id: 'valve.1', setIfTrue: true },
                { id: 'valve.2', setIfTrue: true },
                { id: 'valve.3', setIfTrue: true },
            ],
        });
        adapter.activateScene(sceneId, true);
        await wait(50);
        assert.equal(adapter.stopScene(sceneId), 1);
        await wait(300);
        assert.deepEqual(written, [{ id: 'valve.1', val: true, ack: false }]);
    });

    it('stops the scene if "stop" is written to the scene state', async function () {
        adapter.activateScene(sceneId, true);
        await wait(50);
        written = [];
        adapter.handlers.stateChange(sceneId, { val: 'STOP', ack: false });
        await wait(300);
        // the scene value is restored and the delayed commands are not executed
        assert.deepEqual(written, [{ id: sceneId, val: true, ack: true }]);
    });

    it('does not stop a virtual group, but forwards "stop" to its members', function () {
        adapter.scenes[sceneId].native.virtualGroup = true;
        const activations = [];
        adapter.activateScene = (id, value) => activations.push({ id, value });
        adapter.handlers.stateChange(sceneId, { val: 'stop', ack: false });
        assert.deepEqual(activations, [{ id: sceneId, value: 'stop' }]);
    });

    it('stops the scene via message', async function () {
        const answers = [];
        adapter.sendTo = (from, command, result) => answers.push(result);
        adapter.activateScene(sceneId, true);
        await wait(50);
        await adapter.handlers.message({ command: 'stop', message: sceneId, from: 'test' });
        await adapter.handlers.message({ command: 'stop', message: 'scene.0.unknown', from: 'test' });
        // the answers are created in the context of the adapter, so compare them as JSON
        assert.deepEqual(JSON.parse(JSON.stringify(answers)), [
            { result: '2 pending commands stopped' },
            { error: 'Scene not found' },
        ]);
    });
});

describe('Filter enum members by name (issue #457)', function () {
    const sceneId = 'scene.0.kitchen_left';
    const objects = {};
    for (const side of ['left', 'right']) {
        for (let i = 1; i <= 2; i++) {
            const id = `matter.0.bulb_${side}_${i}`;
            objects[id] = { _id: id, type: 'state', common: { name: { en: `CL ${side} 0${i}`, de: `DL ${side} 0${i}` } } };
        }
    }
    let adapter;

    function createScene(filter) {
        adapter = createAdapter();
        adapter.log = { debug() {}, info() {}, warn() {}, error() {} };
        adapter.getObjectViewAsync = async () => ({
            rows: [{ id: 'enum.rooms.kitchen', value: { common: { members: Object.keys(objects) } } }],
        });
        adapter.getForeignObjectAsync = async id => objects[id] || null;
        adapter.scenes[sceneId] = {
            native: {
                members: [
                    {
                        setIfTrue: true,
                        enums: { rooms: ['enum.rooms.kitchen'], funcs: [], others: [], exclude: [], type: 'boolean', filter },
                    },
                ],
            },
        };
    }

    async function getMemberIds(filter) {
        createScene(filter);
        await adapter.enum2scenes(sceneId, 0);
        return adapter.scenes[sceneId].native.members.map(member => member.id);
    }

    it('uses all members without filter', async function () {
        assert.deepEqual(await getMemberIds(undefined), Object.keys(objects));
        assert.deepEqual(await getMemberIds(''), Object.keys(objects));
    });

    it('filters by name case-insensitive', async function () {
        assert.deepEqual(await getMemberIds('cl LEFT'), ['matter.0.bulb_left_1', 'matter.0.bulb_left_2']);
    });

    it('filters by name in any language and by regular expression', async function () {
        assert.deepEqual(await getMemberIds('^DL right 0[2-9]$'), ['matter.0.bulb_right_2']);
    });

    it('filters by ID', async function () {
        assert.deepEqual(await getMemberIds('_1$'), ['matter.0.bulb_left_1', 'matter.0.bulb_right_1']);
    });

    it('ignores an invalid filter', async function () {
        assert.deepEqual(await getMemberIds('left('), Object.keys(objects));
    });
});
