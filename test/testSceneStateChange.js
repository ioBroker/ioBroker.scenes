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
