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
