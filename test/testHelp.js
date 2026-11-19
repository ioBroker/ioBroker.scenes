'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { COMMANDS, HELP } = require('../build/lib/help');

/** The commands, that onMessage in src/main.ts answers */
function commandsOfMain() {
    const source = fs.readFileSync(path.join(__dirname, '../src/main.ts'), 'utf8');
    const start = source.indexOf('async onMessage(');
    const end = source.indexOf('stopScene(sceneId: string)');
    assert.ok(start > 0 && end > start, 'onMessage found');
    return [...source.slice(start, end).matchAll(/obj\??\.command === '([^']+)'/g)].map(m => m[1]);
}

describe('Message "help"', function () {
    it('lists exactly the commands onMessage answers, each once', function () {
        const names = COMMANDS.map(c => c.command);
        assert.equal(new Set(names).size, names.length);
        assert.deepEqual([...names].sort(), [...new Set(commandsOfMain())].sort());
    });

    it('marks only "help" as read-only', function () {
        for (const { command, write } of COMMANDS) {
            assert.equal(typeof write, 'boolean', command);
            assert.equal(write, command !== 'help', command);
        }
    });

    it('describes every command and the activation by the scene state', function () {
        for (const { command } of COMMANDS.filter(c => c.command !== 'help')) {
            assert.ok(HELP.includes(`- ${command} {`) || HELP.includes(`/ ${command} {`), command);
        }
        for (const word of ['sendTo scenes.0', 'States (scene.0.*)', 'How to talk to the user', 'ack false']) {
            assert.ok(HELP.includes(word), word);
        }
    });

    it('keeps the lines short', function () {
        for (const line of HELP.split('\n')) {
            assert.ok(line.length <= 120, line);
        }
    });
});
