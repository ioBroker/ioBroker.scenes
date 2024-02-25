// Copyright Bluefox <dogafox@gmail.com> 2015-2023
//

// Structure of one scene
// {
//     "common": {
//         "name": "scene 2",
//         "type": "boolean",
//         "role": "scene.state",
//         "desc": "scene 2",
//         "enabled": true,
//         "engine": "system.adapter.scenes.0"
//     },
//     "native": {
//         "burstInterval": 0,
//         "members": [
//             {
//                 "id": "system.adapter.hm-rega.0.alive",
//                 "setIfFalse": false,                       // value if scene set to false
//                 "setIfTrue": true                          // value if scene set to true
//             },
//             {
//                 "id": "system.adapter.hm-rega.0.connected",
//                 "setIfTrue": true
//             },
//             {
//                 "id": "system.adapter.node-red.0.memHeapTotal",
//                 "setIfTrue": null,
//                 "setIfFalse": 28.54,
//                 "setIfFalseTolerance": 1,
//                 "setIfTrueTolerance": 0,
//                 "stopAllDelays": true                      // if all other timers for this ID must be stopped
//             }
//         ],
//         "onTrue": {                                        // Settings for scene if value of scene set to true
//             "triggerId": null,
//             "triggerCond": null,
//             "triggerValue": null,
//             "cron": "",
//             "astro": "",
//         },
//         "onFalse": {                                       // Settings for scene if value of scene set to false
//             "enabled": false,                              // if set to "false" supported
//             "triggerId": null,
//             "triggerCond": null,
//             "triggerValue": null,
//             "cron": "",
//             "astro": "",
//         },
//     }


/* jshint -W097 */
/* jshint strict: false */
/* jslint node: true */
'use strict';

const utils = require('@iobroker/adapter-core'); // Get common adapter utils
const adapterName = require('./package.json').name.split('.').pop();
const ChannelDetector = require('@iobroker/type-detector');
const Types = ChannelDetector.Types;
let schedule;
let adapter;
let enums;
let hasEnums = false;

function startAdapter(options) {
    options = options || {};
    Object.assign(options, {
        name:    adapterName, // adapter name
        strictObjectChecks: false, // because existing scenes have type 'boolean'. But it can have value 'uncertain'
        dirname: __dirname,   // say own position
        unload: cb => {
            Object.keys(scenesTimeout).forEach(id => scenesTimeout[id] && clearTimeout(scenesTimeout[id]));
            scenesTimeout = {};
            cb && cb();
        },
    });

    adapter = new utils.Adapter(options);

    adapter.on('stateChange', (id, state) => {
        if (state) {
            if (scenes[id] && state) {
                scenes[id].value = state;
            }
            if (!state.ack) {
                if (scenes[id]) {
                    if (scenes[id].native.virtualGroup) {
                        activateScene(id, state.val);
                    } else {
                        let val = state.val;
                        if (val === 'true')  val = true;
                        if (val === 'false') val = false;
                        if (val === '0')     val = 0;

                        if (val) {
                            // activate scene
                            activateScene(id, true);
                        } else if (scenes[id].native.onFalse && scenes[id].native.onFalse.enabled) {
                            activateScene(id, false);
                        }
                    }
                }
            }

            if (ids[id]) {
                for (let s = 0; s < ids[id].length; s++) {
                    checkScene(ids[id][s], id, state);
                }
            }

            if (triggers[id]) {
                for (let t = 0; t < triggers[id].length; t++) {
                    checkTrigger(triggers[id][t], id, state, true);
                    checkTrigger(triggers[id][t], id, state, false);
                }
            }
        }
    });

    adapter.on('objectChange', (id, obj) => {
        if (id.startsWith('scene.')) {
            if (scenes[id]) {
                restartAdapter();
            } else if (obj) {
                if (obj.common.engine === `system.adapter.${adapter.namespace}`) {
                    restartAdapter();
                }
            }
        } else if (id.startsWith('enum.') && hasEnums) {
            restartAdapter();
        }
    });

    adapter.on('ready', async () => {
        await main();
        adapter.subscribeForeignObjects('scene.*');
        adapter.subscribeForeignObjects('enum.*');
    });

    adapter.on('message', async obj => {
        if (!obj || !obj.message) {
            return false;
        }
        if (typeof obj.message === 'string' && obj.message.startsWith('{')) {
            try {
                obj.message = JSON.parse(obj.message);
            } catch (e) {
                adapter.log.error(`Cannot parse message: ${obj.message}`);
                adapter.sendTo(obj.from, obj.command, {error: 'Cannot parse message'}, obj.callback);
                return true;
            }
        }
        let sceneId;
        if (typeof obj.message === 'string') {
            sceneId = obj.message;
        } else if (obj.message && obj.message.sceneId) {
            sceneId = obj.message.sceneId;
        }

        if (!sceneId) {
            adapter.log.error(`Cannot find scene ID in message: ${JSON.stringify(obj.message)}`);
            adapter.sendTo(obj.from, obj.command, {error: 'No scene ID'}, obj.callback);
            return true;
        }

        if (sceneId && obj.command === 'save') {
            let isForTrue = true;
            if (typeof obj.message === 'object' && obj.message.isForTrue !== undefined) {
                isForTrue = obj.message.isForTrue;
            }

            try {
                const allSaved = await saveScene(obj.message.sceneId, isForTrue);
                adapter.sendTo(obj.from, obj.command, {result: 'Current states saved', allSaved}, obj.callback);
            } catch (err) {
                adapter.sendTo(obj.from, obj.command, {error: err}, obj.callback);
            }
        } else if (obj.command === 'enable') {
            let sceneObj;
            try {
                sceneObj = await adapter.getForeignObjectAsync(sceneId);
            } catch (e) {
                adapter.log.error(`Cannot get scene: ${e}`);
                adapter.sendTo(obj.from, obj.command, {error: `Cannot get scene: ${e}`}, obj.callback);
                return true;
            }
            if (sceneObj) {
                if (!sceneObj.common.enabled) {
                    sceneObj.common.enabled = true;
                    delete sceneObj.ts;
                    await adapter.setForeignObjectAsync(sceneObj._id, sceneObj);
                    adapter.sendTo(obj.from, obj.command, {result: 'Scene was enabled'}, obj.callback);
                } else {
                    adapter.sendTo(obj.from, obj.command, {warning: 'Scene already enabled'}, obj.callback);
                }
            }
        } else if (obj.command === 'disable') {
            let sceneObj;
            try {
                sceneObj = await adapter.getForeignObjectAsync(sceneId);
            } catch (e) {
                adapter.log.error(`Cannot get scene: ${e}`);
                adapter.sendTo(obj.from, obj.command, {error: `Cannot get scene: ${e}`}, obj.callback);
                return true;
            }
            if (sceneObj) {
                if (sceneObj.common.enabled !== false) {
                    sceneObj.common.enabled = false;
                    delete sceneObj.ts;
                    await adapter.setForeignObjectAsync(sceneObj._id, sceneObj);
                    adapter.sendTo(obj.from, obj.command, { result: 'Scene was disabled' }, obj.callback);
                } else {
                    adapter.sendTo(obj.from, obj.command, {warning: 'Scene already disabled'}, obj.callback);
                }
            }
        }

        return true;
    });

    return adapter;
}

// expects like: scene.0.blabla
async function saveScene(sceneID, isForTrue) {
    if (isForTrue === undefined) {
        isForTrue = true;
    }

    adapter.log.debug(`Saving ${sceneID}...`);

    let obj;
    try {
        obj = await adapter.getForeignObjectAsync(sceneID);
        delete obj.ts;
    } catch (e) {
        adapter.log.error(`Cannot get scene: ${e}`);
        throw new Error('Scene not found');
    }
    if (obj?.native?.members) {
        let anyNotSaved = false;
        for (let m = 0; m < obj.native.members.length; m++) {
            const member = obj.native.members[m];
            let state
            if (member.id) {
                state = await adapter.getForeignStateAsync(member.id);
                console.log(`ID ${member.id}=${state ? state.val : state}`);
            } else {
                // enum => get all states and their values
                const ids = getAllEnumIds(member.enums);
                const values = [];
                // copy all settings from the first member
                for (let i = 0; i < ids.length; i++) {
                    const controlId = await getControlState(ids[i], member.enums.type, sceneID);
                    if (!controlId) {
                        continue;
                    }
                    const value = await adapter.getForeignStateAsync(controlId);
                    if (value) {
                        values.push(value.val);
                    }
                }
                // determine common state
                if (member.enums.type === 'boolean' || member.enums.type === 'string') {
                    // all states must be true or false
                    let val = values[0];
                    for (let i = 1; i < values.length; i++) {
                        if (val !== values[i]) {
                            val = 'uncertain';
                            break;
                        }
                    }
                    state = {val};
                    adapter.log.info(`Take for member ${m} of (${sceneID}) value "${val}" from ${values.length} states`);
                } else if (member.enums.type === 'number') {
                    // calculate average
                    let val = values[0];
                    for (let i = 1; i < values.length; i++) {
                        val += values[i];
                    }
                    val /= values.length;
                    state = {val};
                    adapter.log.info(`Take for member ${m} of (${sceneID}) average value "${val}" from ${values.length} states`);
                }
            }
            if (state?.val !== 'uncertain') {
                if (isForTrue) {
                    member.setIfTrue  = state ? state.val : null;
                } else {
                    member.setIfFalse = state ? state.val : null;
                }
            } else {
                anyNotSaved = true;
            }
        }

        try {
            delete obj.ts;
            await adapter.setForeignObjectAsync(sceneID, obj);
            adapter.log.info(`Scene ${obj.common.name} saved`);
            return !anyNotSaved;
        } catch (e) {
            adapter.log.error(`Cannot save scene: ${e}`);
            throw new Error('Cannot save scene');
        }
    } else {
        throw new Error(obj ? 'Scene not found' : 'Scene has no members');
    }
}

function restartAdapter() {
    adapter.log.info('restartAdapter');

    // stop all timers
    Object.keys(checkTimers).forEach(id =>
        checkTimers[id] && clearTimeout(checkTimers[id]));
    checkTimers = {};

    Object.keys(timers).forEach(id =>
        timers[id].forEach(tt =>
            timers[id][tt] && timers[id][tt].timer && clearTimeout(timers[id][tt].timer)));
    timers = {};

    schedule && Object.keys(cronTasks).forEach(id => {
        cronTasks[`${id}_true`] && cronTasks[`${id}_true`].cancel();
        cronTasks[`${id}_false`] && cronTasks[`${id}_false`].cancel();
    });

    if (!subscription) {
        adapter.unsubscribeForeignStates();
    } else {
        adapter.unsubscribeForeignStates('scene.*');
        // and for all states
        subscription.forEach(pattern =>
            adapter.unsubscribeForeignStates(pattern));
    }
    subscription = null;
    scenes       = {};
    ids          = {};
    triggers     = {};
    timers       = {};
    tIndex       = 1;
    checkTimers  = {};
    cronTasks    = {};

    main()
        .catch(e => adapter.log.error(`Cannot restart adapter: ${e}`));
}

let subscription  = null;
let scenes        = {};
let ids           = {};
let triggers      = {};
let timers        = {};
let checkTimers   = {};
let cronTasks     = {};
let scenesTimeout = {};

// Check if actual states are exactly as desired in the scene
function checkScene(sceneId, stateId, state) {
    // calculate stacked delay
    let delay = 0; // not used actually
    let stacked = false;
    const burstInterval = scenes[sceneId].native.burstInterval;

    for (let i = 0; i < scenes[sceneId].native.members.length; i++) {
        if (scenes[sceneId].native.members[i].stackNextDelays) {
            stacked = true;
        }

        // Do not check states with big delays
        if (/*delay + */scenes[sceneId].native.members[i].delay > 1000) {
            if (stacked) {
                delay += scenes[sceneId].native.members[i].delay;
            }
            delay += burstInterval;
            continue;
        } else if (stacked) {
            delay += scenes[sceneId].native.members[i].delay;
            delay += burstInterval;
        }

        // if state must be updated
        if (stateId && scenes[sceneId].native.members[i].id === stateId) {
            scenes[sceneId].native.members[i].actual = state.val;
        }
    }

    checkTimers[sceneId] = checkTimers[sceneId] || setTimeout(async _sceneId => {
        checkTimers[_sceneId] = null;
        let activeTrue  = null;
        let activeFalse = null;
        let activeValue = null;

        const sceneObj       = scenes[_sceneId];
        const sceneObjNative = sceneObj.native;
        const isWithFalse    = sceneObjNative.onFalse && sceneObjNative.onFalse.enabled;
        let avgCounter = 0;
        let stacked = false;
        let delay = 0; // not used actually
        const burstInterval = sceneObjNative.burstInterval;

        for (let i = 0; i < sceneObjNative.members.length; i++) {
            if (sceneObjNative.members[i].stackNextDelays) {
                stacked = true;
            }
            // Do not check states with big delays
            if (/*delay + */sceneObjNative.members[i].delay > 1000) {
                if (stacked) {
                    delay += sceneObjNative.members[i].delay;
                }
                continue;
            } else if (stacked) {
                delay += sceneObjNative.members[i].delay;
                delay += burstInterval;
            }

            // There are some states
            if (activeTrue  === null) {
                activeTrue  = true;
            }
            if (activeFalse === null) {
                activeFalse = true;
            }

            if (sceneObjNative.virtualGroup) {
                if (activeValue === 'uncertain') {
                    continue;
                }

                if (activeValue === null) {
                    activeValue = sceneObjNative.members[i].actual;
                } else {
                    // eslint-disable-next-line eslint-disable-line
                    if (activeValue != sceneObjNative.members[i].actual) {
                        if (sceneObjNative.aggregation === undefined || sceneObjNative.aggregation === 'uncertain') {
                            activeValue = 'uncertain';
                        } else {
                            if (sceneObjNative.aggregation === 'any') {
                                activeValue = activeValue || sceneObjNative.members[i].actual;
                            } else if (sceneObjNative.aggregation === 'min') {
                                activeValue = Math.min(activeValue, sceneObjNative.members[i].actual);
                            } else if (sceneObjNative.aggregation === 'max') {
                                activeValue = Math.max(activeValue, sceneObjNative.members[i].actual);
                            } else if (sceneObjNative.aggregation === 'avg') {
                                activeValue = parseFloat(activeValue) + parseFloat(sceneObjNative.members[i].actual);
                                avgCounter++;
                            }
                        }
                    } else if (sceneObjNative.aggregation === 'avg') {
                        activeValue = parseFloat(activeValue) + parseFloat(sceneObjNative.members[i].actual);
                        avgCounter++;
                    }
                }
            } else {
                let setIfTrue;
                let setIfFalse;
                try {
                    setIfTrue  = await getSetValue(sceneObjNative.members[i].setIfTrue);
                    setIfFalse = await getSetValue(sceneObjNative.members[i].setIfFalse);
                } catch (e) {
                    adapter.log.warn(`Error while getting True/False states: ${e}`);
                }

                if (setIfTrue !== null && setIfTrue !== undefined) {
                    if (sceneObjNative.members[i].setIfTrueTolerance) {
                        if (Math.abs(setIfTrue - sceneObjNative.members[i].actual) > sceneObjNative.members[i].setIfTrueTolerance) {
                            activeTrue = false;
                        }
                    } else {
                        // eslint-disable-next-line eslint-disable-line
                        if (setIfTrue != sceneObjNative.members[i].actual) {
                            activeTrue = false;
                        }
                    }
                }

                if (isWithFalse && setIfFalse !== null && setIfFalse !== undefined) {
                    if (sceneObjNative.members[i].setIfFalseTolerance) {
                        if (Math.abs(setIfFalse - sceneObjNative.members[i].actual) > sceneObjNative.members[i].setIfFalseTolerance) {
                            activeFalse = false;
                        }
                    } else
                    // eslint-disable-next-line eslint-disable-line
                    if (setIfFalse != sceneObjNative.members[i].actual) {
                        activeFalse = false;
                    }
                }
            }
        }

        try {
            if (sceneObjNative.virtualGroup) {
                if (activeValue !== null) {
                    if (sceneObjNative.aggregation === 'avg' && avgCounter) {
                        activeValue = activeValue / (avgCounter + 1);
                    }

                    if (sceneObj.value.val !== activeValue || !sceneObj.value.ack) {
                        sceneObj.value.val = activeValue;
                        sceneObj.value.ack = true;

                        await adapter.setForeignStateAsync(_sceneId, activeValue, true);
                    }
                }
            } else {
                if (sceneObjNative.onFalse && sceneObjNative.onFalse.enabled) {
                    if (activeTrue) {
                        if (sceneObj.value.val !== true || !sceneObj.value.ack) {
                            sceneObj.value.val = true;
                            sceneObj.value.ack = true;

                            await adapter.setForeignStateAsync(_sceneId, true, true);
                        }
                    } else if (activeFalse) {
                        if (sceneObj.value.val !== false || !sceneObj.value.ack) {
                            sceneObj.value.val = false;
                            sceneObj.value.ack = true;

                            await adapter.setForeignStateAsync(_sceneId, false, true);
                        }
                    } else {
                        if (sceneObj.value.val !== 'uncertain' || !sceneObj.value.ack) {
                            sceneObj.value.val = 'uncertain';
                            sceneObj.value.ack = true;

                            await adapter.setForeignStateAsync(_sceneId, 'uncertain', true);
                        }
                    }
                } else {
                    if (activeTrue !== null) {
                        if (sceneObj.value.val !== activeTrue || !sceneObj.value.ack) {
                            sceneObj.value.val = activeTrue;
                            sceneObj.value.ack = true;

                            await adapter.setForeignStateAsync(_sceneId, activeTrue, true);
                        }
                    }
                }
            }
        } catch (err) {
            adapter.log.error(`Can not set requested state ${_sceneId}: ${err.message}`);
        }
    }, 200, sceneId);
}

function checkTrigger(sceneId, stateId, state, isTrue) {
    let val;
    let fVal;
    let aVal;

    if (!state) {
        return;
    }

    let trigger = isTrue ? scenes[sceneId].native.onTrue : scenes[sceneId].native.onFalse;
    if (!trigger || trigger.enabled === false || !trigger.trigger) {
        return;
    }
    trigger = trigger.trigger;

    if (trigger.id === stateId) {
        const stateVal = (state && state.val !== undefined && state.val !== null) ? state.val.toString() : '';

        val = trigger.value;

        adapter.log.debug(`checkTrigger: ${trigger.id}(${state.val}) ${trigger.condition} ${val.toString()}`);

        switch (trigger.condition) {
            case undefined:
            case '==':
                if (val == stateVal) {
                    activateScene(sceneId, isTrue);
                }
                break;

            case '!=':
                if (val != stateVal) {
                    activateScene(sceneId, isTrue);
                }
                break;

            case '>':
                fVal = parseFloat(val);
                aVal = parseFloat(stateVal);
                if (fVal.toString() == val && stateVal === aVal.toString()) {
                    if (aVal > fVal) {
                        activateScene(sceneId, isTrue);
                    }
                } else
                if (val > stateVal) {
                    activateScene(sceneId, isTrue);
                }
                break;

            case '<':
                fVal = parseFloat(val);
                aVal = parseFloat(stateVal);
                if (fVal.toString() == val && stateVal === aVal.toString()) {
                    if (aVal < fVal) {
                        activateScene(sceneId, isTrue);
                    }
                } else
                if (val < stateVal) {
                    activateScene(sceneId, isTrue);
                }
                break;

            case '>=':
                fVal = parseFloat(val);
                aVal = parseFloat(stateVal);
                if (fVal.toString() == val && stateVal === aVal.toString()) {
                    if (aVal >= fVal) {
                        activateScene(sceneId, isTrue);
                    }
                } else
                if (val >= stateVal) {
                    activateScene(sceneId, isTrue);
                }
                break;

            case '<=':
                fVal = parseFloat(val);
                aVal = parseFloat(stateVal);
                if (fVal.toString() == val && stateVal === aVal.toString()) {
                    if (aVal <= fVal) {
                        activateScene(sceneId, isTrue);
                    }
                } else
                if (val <= stateVal) {
                    activateScene(sceneId, isTrue);
                }
                break;

            case 'update':
                activateScene(sceneId, isTrue);
                break;

            default:
                adapter.log.error(`Unsupported condition: ${trigger.condition}`);
                break;
        }
    }
}

let tIndex = 1; // never ending counter

function getSetValue(value) {
    const m = typeof value === 'string' && value.match(/^\s*{{([^}]*)}}\s*$/);
    if (m) {
        if (!m[1]) {
            return Promise.reject(`Value did not contain a state ID: ${value}`);
        }
        // try to read setValue from other stateId
        return adapter.getForeignStateAsync(m[1])
            .then(state =>
                state ? state.val : Promise.reject(`State ${m[1]} is empty`));
    } else {
        return Promise.resolve(value);
    }
}

// Set one state of the scene
function activateSceneState(sceneId, state, isTrue) {
    if (!scenes[sceneId]) {
        return adapter.log.error(`Unexpected error: Scene "${sceneId}" does not exist!`);
    }

    const stateObj = scenes[sceneId].native.members[state];
    let desiredValue;
    if (!scenes[sceneId].native.virtualGroup) {
        if (stateObj) {
            desiredValue = isTrue ? stateObj.setIfTrue : stateObj.setIfFalse;
        }
    } else {
        desiredValue = isTrue;
    }

    if (desiredValue === null || desiredValue === undefined) {
        return adapter.log.debug(`Ignore in "${sceneId}" the ${state} by ${isTrue}, is defined as NULL.`);
    }

    // calculate stacked delay
    let delay = 0;
    let stacked = false;
    for (let u = 0; u < state; u++) {
        if (scenes[sceneId].native.members[u].stackNextDelays) {
            stacked = true;
        }
        if (stacked) {
            delay += scenes[sceneId].native.members[u].delay;
        }
    }

    delay += stateObj.delay;

    getSetValue(desiredValue)
        .then(desiredValue => {
            if (delay) {
                timers[stateObj.id] = timers[stateObj.id] || [];

                if (stateObj.stopAllDelays && timers[stateObj.id].length) {
                    adapter.log.debug(`Cancel running timers (${timers[stateObj.id].length} for ${stateObj.id}`);
                    timers[stateObj.id].forEach(item => clearTimeout(item.timer));
                    timers[stateObj.id] = [];
                }
                tIndex++;

                // Start timeout
                const timer = setTimeout(async (id, setValue, _tIndex) => {
                    adapter.log.debug(`Set delayed state for "${sceneId}": ${id} = ${setValue}`);

                    // execute timeout
                    if (stateObj.doNotOverwrite) {
                        adapter.getForeignState(id, (err, state) => {
                            // Set new state only if differ from the desired state
                            if (!state || state.val !== setValue) {
                                adapter.setForeignState(id, setValue, !!stateObj.ackTrue);
                            }
                        });
                    } else {
                        adapter.setForeignState(id, setValue, !!stateObj.ackTrue);
                    }

                    if (timers[id]) {
                        // remove timer from the list
                        for (let r = 0; r < timers[id].length; r++) {
                            if (timers[id][r].tIndex === _tIndex) {
                                timers[id].splice(r, 1);
                                break;
                            }
                        }
                    }
                }, delay, stateObj.id, desiredValue, tIndex);

                timers[stateObj.id].push({timer, tIndex});
            } else {
                if (stateObj.stopAllDelays && timers[stateObj.id] && timers[stateObj.id].length) {
                    adapter.log.debug(`Cancel running timers for "${stateObj.id}" (${timers[stateObj.id].length})`);
                    timers[stateObj.id].forEach(item => clearTimeout(item.timer));
                    timers[stateObj.id] = [];
                }
                // Set the desired state
                if (stateObj.doNotOverwrite) {
                    adapter.getForeignState(stateObj.id, (err, state) => {
                        // Set new state only if differ from the desired state
                        if (!state || state.val !== desiredValue) {
                            adapter.setForeignState(stateObj.id, desiredValue, !!stateObj.ackTrue);
                        }
                    });
                } else {
                    adapter.setForeignState(stateObj.id, desiredValue, !!stateObj.ackTrue);
                }
            }
        })
        .catch(e =>
            adapter.log.error(`Cannot read setValue from ${desiredValue.toString().replace(/^\s*{{/, '').replace(/}}\s*$/, '')}: ${e}`));
}

// Set all states of the state with an interval
function activateSceneStates(sceneId, state, isTrue, interval, callback) {
    if (!scenes[sceneId]) {
        adapter.log.error(`Unexpected error: Scene "${sceneId}" does not exist!`);
        return callback();
    }
    if (!scenes[sceneId].native.members[state]) {
        return callback();
    }
    if (!state) {
        activateSceneState(sceneId, state, isTrue);
        state++;
        if (!scenes[sceneId].native.members[state]) {
            return callback();
        }
    }

    scenesTimeout[`${sceneId}_${state}`] = setTimeout(() => {
        scenesTimeout[`${sceneId}_${state}`] = null;
        activateSceneState(sceneId, state, isTrue);
        activateSceneStates(sceneId, state + 1, isTrue, interval, callback);
    }, interval);
}

function activateScene(sceneId, isTrue) {
    adapter.log.debug(`activateScene: execute for "${sceneId}" (${isTrue})`);

    if (!scenes[sceneId]) {
        adapter.log.error(`Unexpected error: Scene "${sceneId}" does not exist!`);
        return;
    }

    scenes[sceneId].native.burstInterval = parseInt(scenes[sceneId].native.burstInterval, 10);

    // all commands must be executed without an interval
    if (!scenes[sceneId].native.burstInterval) {
        for (let state = 0; state < scenes[sceneId].native.members.length; state++) {
            activateSceneState(sceneId, state, isTrue);
        }

        if (!scenes[sceneId].native.virtualGroup) {
            if (scenes[sceneId].native.onFalse && scenes[sceneId].native.onFalse.enabled) {
                if (scenes[sceneId].value.val !== isTrue || !scenes[sceneId].value.ack) {
                    adapter.log.debug(`activateScene: new state for "${sceneId}" is "${isTrue}"`);
                    scenes[sceneId].value.val = isTrue;
                    scenes[sceneId].value.ack = true;
                    adapter.setForeignState(sceneId, isTrue, true);
                }
            } else if (scenes[sceneId].value.val !== true || !scenes[sceneId].value.ack) {
                adapter.log.debug(`activateScene: new state for "${sceneId}" is "true"`);
                scenes[sceneId].value.val = true;
                scenes[sceneId].value.ack = true;
                adapter.setForeignState(sceneId, true, true);
            }
        }
    } else {
        // make some interval between commands
        activateSceneStates(sceneId, 0, isTrue, scenes[sceneId].native.burstInterval, () => {
            // possible scene was renamed
            if (!scenes[sceneId]) {
                return;
            }
            if (scenes[sceneId].native.onFalse && scenes[sceneId].native.onFalse.enabled) {
                if (scenes[sceneId].value.val !== isTrue || !scenes[sceneId].value.ack) {
                    adapter.log.debug(`activateScene: new state for "${sceneId}" is "${isTrue}"`);
                    scenes[sceneId].value.val = isTrue;
                    scenes[sceneId].value.ack = true;
                    adapter.setForeignState(sceneId, isTrue, true);
                }
            } else if (scenes[sceneId].value.val !== true || !scenes[sceneId].value.ack) {
                adapter.log.debug(`activateScene: new state for "${sceneId}" is "true"`);
                scenes[sceneId].value.val = true;
                scenes[sceneId].value.ack = true;
                adapter.setForeignState(sceneId, true, true);
            }
        });
    }
}

function getState(sceneId, stateNumber, callback) {
    const stateId = scenes[sceneId].native.members[stateNumber].id;
    adapter.getForeignState(stateId, (err, state) => {
        // possible scene was renamed
        if (!scenes[sceneId] || !scenes[sceneId].native || !scenes[sceneId].native.members || !scenes[sceneId].native.members[stateNumber]) {
            return;
        }

        scenes[sceneId].native.members[stateNumber].actual = state ? state.val : null;

        // If processing finished
        if (!--scenes[sceneId].count) {
            delete scenes[sceneId].count;
            checkScene(sceneId);
        }
    });
}

function initTrueFalse(sceneId, isTrue) {
    const usedIds = [];
    const sStruct = isTrue ? scenes[sceneId].native.onTrue : scenes[sceneId].native.onFalse;
    if (!sStruct || sStruct.enabled === false) {
        return;
    }

    // remember triggers for true
    if (sStruct.trigger && sStruct.trigger.id) {
        usedIds.push(sStruct.trigger.id);
        triggers[sStruct.trigger.id] = triggers[sStruct.trigger.id] || [];
        if (!triggers[sStruct.trigger.id].includes(sceneId)) {
            triggers[sStruct.trigger.id].push(sceneId);
        }
    }
    // initiate cron tasks
    if (sStruct.cron) {
        schedule = schedule || require('node-schedule');

        adapter.log.debug(`Initiate cron task for ${sceneId}(${isTrue}): ${sStruct.cron}`);

        if (cronTasks[`${sceneId}_${isTrue}`]) {
            cronTasks[`${sceneId}_${isTrue}`].cancel();
            cronTasks[`${sceneId}_${isTrue}`] = null;
        }

        cronTasks[`${sceneId}_${isTrue}`] = schedule.scheduleJob(sStruct.cron, () => {
            adapter.log.debug(`cron for ${sceneId}(${isTrue}): ${sStruct.cron}`);
            activateScene(sceneId, isTrue);
        });
    } else if (cronTasks[`${sceneId}_${isTrue}`]) {
        cronTasks[`${sceneId}_${isTrue}`].cancel();
        delete cronTasks[`${sceneId}_${isTrue}`];
    }

    return usedIds;
}

function getAllEnumIds(enumsSettings) {
    const ids = [];

    enumsSettings.rooms.forEach(roomId => {
        const members = enums[roomId].common.members;
        for (let r = 0; r < members.length; r++) {
            if (!ids.includes(members[r])) {
                ids.push(members[r]);
            }
        }
    });

    if (!enumsSettings.rooms.length) {
        enumsSettings.funcs.forEach(funcId => {
            const members = enums[funcId].common.members;
            for (let r = 0; r < members.length; r++) {
                if (!ids.includes(members[r])) {
                    ids.push(members[r]);
                }
            }
        });
    } else if (enumsSettings.funcs.length) {
        for (let i = ids.length - 1; i >= 0; i--) {
            const id = ids[i];
            // find this id in all functions
            if (!enumsSettings.funcs.find(funcId => enums[funcId].common.members.includes(id))) {
                ids.splice(i, 1);
            }
        }
    }
    enumsSettings.others.forEach(enumId => {
        const members = enums[enumId].common.members;
        for (let r = 0; r < members.length; r++) {
            if (!ids.includes(members[r])) {
                ids.push(members[r]);
            }
        }
    });
    for (let e = 0; e < enumsSettings.exclude.length; e++) {
        const index = ids.indexOf(enumsSettings.exclude[e]);
        if (index !== -1) {
            ids.splice(index, 1);
        }
    }
    return ids;
}

const NAMES = {
    [Types.airCondition]: {boolean: 'POWER', number: 'SET'},
    [Types.blind]: {number: 'SET'},
    [Types.cie]: {string: 'CIE', boolean: 'ON'},
    [Types.ct]: {number: 'TEMPERATURE', boolean: 'ON'},
    [Types.dimmer]: {boolean: 'ON_SET', number: 'SET'},
    [Types.gate]: {boolean: 'SET'},
    [Types.hue]: {boolean: 'ON', number: 'DIMMER|BRIGHTNESS'},
    [Types.slider]: {number: 'SET'},
    [Types.light]: {boolean: 'SET'},
//    [Types.lock]: {boolean: 'SET'}, // not supported yet
    [Types.media]: {boolean: 'STATE'},
    [Types.rgb]: {boolean: 'ON', number: 'DIMMER|BRIGHTNESS'},
    [Types.rgbSingle]: {boolean: 'ON', string: 'RGB'},
    [Types.rgbwSingle]: {boolean: 'ON', string: 'RGBW'},
    [Types.socket]: {boolean: 'SET'},
    [Types.vacuumCleaner]: {boolean: 'POWER'},
    [Types.volume]: {boolean: 'SET'},
    [Types.volumeGroup]: {boolean: 'SET'},
};

async function findControlState(obj, type) {
    // read all states of the device
    const objs = await adapter.getObjectViewAsync('system', 'state', {
        startkey: `${obj._id}.\u0000`,
        endkey: `${obj._id}.\u9999`,
    });
    const objects = {};
    objs.rows.forEach(item => objects[item.id] = item.value);
    objects[obj._id] = obj;
    const keys = Object.keys(objects);

    let found = false;
    // if it is only one state with this type and writable, take it
    for (let i = 0; i < keys.length; i++) {
        const id = keys[i];
        if (objects[id].type === 'state' && objects[id].common.type === type && objects[id].common.write !== false) {
            if (!found) {
                found = id;
            } else {
                // more than one state with this type
                found = false;
                break;
            }
        }
    }
    // try to use always the device detector
    if (false && found) {
        return found;
    }

    // else try to use type detector
    const detector = new ChannelDetector.default();

    // initialize iobroker type detector
    const usedIds = [];
    const ignoreIndicators = ['UNREACH_STICKY'];    // Ignore indicators by name
    const excludedTypes = ['info'];
    const options = {
        objects,
        _keysOptional: keys,
        _usedIdsOptional: usedIds,
        ignoreIndicators,
        excludedTypes,
    };
    options.id = obj._id;
    let controls = detector.detect(options);
    if (controls && controls.length) {
        // try to find in all controls
        for (let c = 0; c < controls.length; c++) {
            const control = controls[c];
            if (NAMES[control.type] && NAMES[control.type][type]) {
                const names = NAMES[control.type][type].split('|');
                for (let t = 0; t < names.length; t++) {
                    const st = control.states.find(state => state.name === names[t] && state.id);
                    if (st) {
                        return st.id;
                    }
                }
            }
        }
    }
    return null;
}

async function getControlState(id, type, sceneId) {
    const obj = await adapter.getForeignObjectAsync(id);
    if (!obj) {
        return null;
    }
    if (obj.type !== 'state') {
        if (obj.type === 'channel' || obj.type === 'device' || obj.type === 'folder') {
            // try to use types detector to find the control state
            const controlId = await findControlState(obj, type || 'boolean');
            if (!controlId) {
                adapter.log.warn(`Cannot find control state of type "${type || 'boolean'}" for "${obj.type}" ${id} in "${sceneId}"`);
                return null;
            }
            return controlId;
        } else {
            adapter.log.warn(`Cannot find control state for ${id} as it is not device or channel`);
            return null;
        }
    }

    return id;
}

async function enum2scenes(sceneId, index) {
    if (!hasEnums) {
        hasEnums = true;
        // read enums
        const objs = await adapter.getObjectViewAsync('system', 'enum', {
            startkey: 'enum.\u0000',
            endkey: 'enum.\u9999',
        });
        enums = {};
        objs.rows.forEach(item => enums[item.id] = item.value);
    }
    const patternMember = JSON.parse(JSON.stringify(scenes[sceneId].native.members[index]));
    const enumsSettings = JSON.parse(JSON.stringify(patternMember.enums));
    delete patternMember.enums;
    // remove this member from a list
    scenes[sceneId].native.members.splice(index, 1);

    // collect all IDs in this enum
    const ids = getAllEnumIds(enumsSettings);

    // copy all settings from the first member
    for (let i = 0; i < ids.length; i++) {
        const controlId = await getControlState(ids[i], enumsSettings.type, sceneId);
        if (!controlId) {
            continue;
        }
        const newMember = JSON.parse(JSON.stringify(patternMember));
        newMember.id = controlId;

        if (i) {
            newMember.delay = enumsSettings.delay || 0;
        }
        // place this member on the place of index
        scenes[sceneId].native.members.splice(index++, 0, newMember);
    }
}

async function initScenes() {
    const countIds = [];
    hasEnums = false;

    // list all scenes in Object
    for (const sceneId in scenes) {
        if (!scenes.hasOwnProperty(sceneId)) {
            continue;
        }

        scenes[sceneId].count = 0;
        scenes[sceneId].value = {val: null, ack: true}; // default state

        // Go through all states in Array
        for (let state = 0; state < scenes[sceneId].native.members.length; state++) {
            const stateId = scenes[sceneId].native.members[state].id;
            // calculate subscriptions
            if (!countIds.includes(stateId)) {
                countIds.push(stateId);
            }

            // remember which scenes uses this state
            ids[stateId] = ids[stateId] || [];
            if (!ids[stateId].includes(sceneId)) {
                ids[stateId].push(sceneId);
            }

            // Convert delay
            if (scenes[sceneId].native.members[state].delay) {
                const delay = parseInt(scenes[sceneId].native.members[state].delay, 10);
                if (scenes[sceneId].native.members[state].delay != delay.toString()) {
                    adapter.log.error(`Invalid delay for scene "${sceneId}": ${scenes[sceneId].native.members[state].delay}`);
                    scenes[sceneId].native.members[state].delay = 0;
                } else {
                    scenes[sceneId].native.members[state].delay = delay;
                }
            } else {
                scenes[sceneId].native.members[state].delay = 0;
            }

            /*
            if (scenes[sceneId].native.members[state].setIfTrue === undefined || scenes[sceneId].native.members[state].setIfTrue === null) {
                scenes[sceneId].native.members[state].setIfTrue = false;
            }
            if (scenes[sceneId].native.members[state].setIfFalse === undefined || scenes[sceneId].native.members[state].setIfFalse === null) {
                scenes[sceneId].native.members[state].setIfFalse = false;
            }*/

            scenes[sceneId].count++;
            // read actual state
            getState(sceneId, state);
        }

        if (scenes[sceneId].native.onTrue  && scenes[sceneId].native.onTrue.trigger)  {
            if (scenes[sceneId].native.onTrue.trigger.value === null || scenes[sceneId].native.onTrue.trigger.value === undefined) {
                scenes[sceneId].native.onTrue.trigger.value  = '';
            } else {
                scenes[sceneId].native.onTrue.trigger.value  = scenes[sceneId].native.onTrue.trigger.value.toString();
            }
        }

        if (scenes[sceneId].native.onFalse && scenes[sceneId].native.onFalse.trigger) {
            if (scenes[sceneId].native.onFalse.trigger.value === null || scenes[sceneId].native.onFalse.trigger.value === undefined) {
                scenes[sceneId].native.onFalse.trigger.value  = '';
            } else {
                scenes[sceneId].native.onFalse.trigger.value  = scenes[sceneId].native.onFalse.trigger.value.toString();
            }
        }

        // Init trigger, cron and astro for onTrue
        let usedIds = initTrueFalse(sceneId, true);
        usedIds && usedIds.forEach(id => !countIds.includes(id) && countIds.push(id));

        // Init trigger, cron and astro for onFalse
        usedIds = initTrueFalse(sceneId, false);
        usedIds && usedIds.forEach(id => !countIds.includes(id) && countIds.push(id));
    }

    // If it is requested more than 20 ids, get all of them
    if (countIds.length > 200) {
        adapter.log.debug('initScenes: subscribe on all');

        await adapter.subscribeForeignStatesAsync();
    } else {
        // subscribe for own scenes
        await adapter.subscribeForeignStatesAsync('scene.*');
        subscription = countIds;
        // and for all states
        for (let i = 0; i < countIds.length; i++) {
            adapter.log.debug(`initScenes: subscribe on ${countIds[i]}`);
            await adapter.subscribeForeignStatesAsync(countIds[i]);
        }
    }
}

async function main() {
    // Read all scenes
    const states = await adapter.getForeignObjectsAsync('scene.*', 'state');
    if (states) {
        for (const id in states) {
            // ignore if no states involved
            if (!states.hasOwnProperty(id) || !states[id].native || !states[id].native.members || !states[id].native.members.length) {
                continue;
            }
            // ignore if a scene is disabled
            if (!states[id].common.enabled) {
                continue;
            }
            // ignore if another instance
            if (states[id].common.engine !== `system.adapter.${adapter.namespace}`) {
                continue;
            }

            scenes[id] = states[id];
            scenes[id].native = scenes[id].native || {};

            // rename attribute
            if (scenes[id].native.burstIntervall !== undefined) {
                scenes[id].native.burstInterval = scenes[id].native.burstIntervall;
                delete scenes[id].native.burstIntervall;
            }

            // Remove all disabled scenes
            for (let m = states[id].native.members.length - 1; m >= 0; m--) {
                if (!scenes[id].native.members[m] || states[id].native.members[m].disabled) {
                    scenes[id].native.members.splice(m, 1);
                    continue;
                }

                // Reset actual state
                scenes[id].native.members[m].actual = null;
            }

            if (!states[id].native.members.length) {
                delete scenes[id];
            }

            // extend all enums to simple scenes
            let i;
            do {
                i = scenes[id].native.members.findIndex(member => member.enums);
                if (i !== -1) {
                    await enum2scenes(id, i);
                }
            } while (i !== -1);
        }
    }

    await initScenes();
}

// If started as allInOne mode => return function to create instance
if (module && module.parent) {
    module.exports = startAdapter;
} else {
    // or start the instance directly
    startAdapter();
}

