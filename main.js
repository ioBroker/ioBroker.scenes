// Copyright Bluefox <dogafox@gmail.com> 2015-2021
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

let schedule;
let adapter;
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
        if (id.match(/^scene\./)) {
            if (scenes[id]) {
                restartAdapter();
            } else if (obj) {
                if (obj.common.engine === 'system.adapter.' + adapter.namespace) {
                    restartAdapter();
                }
            }
        }
    });

    adapter.on('ready', () => {
        main();
        adapter.subscribeForeignObjects('scene.*');
    });

    adapter.on('message', obj => {
        if (!obj || !obj.message) {
            return false;
        }

        if (obj && obj.command === 'save') {
            if (typeof obj.message !== 'object') {
                try {
                    obj.message = JSON.parse(obj.message)
                } catch (e) {
                    adapter.log.error('Cannot parse message: ' + obj.message);
                    adapter.sendTo(obj.from, obj.command, {error: 'Cannot parse message'}, obj.callback);
                    return true;
                }
            }

            saveScene(obj.message.sceneId, obj.message.isForTrue, err => {
                adapter.sendTo(obj.from, obj.command, {error: err}, obj.callback);
            });
        }

        return true;
    });

    return adapter;
}

// expects like: scene.0.blabla
function saveScene(sceneID, isForTrue, cb) {
    if (isForTrue === undefined) {
        isForTrue = true;
    }

    adapter.log.debug('Saving ' + sceneID + '...');

    adapter.getForeignObject(sceneID, (err, obj) => {
        if (obj && obj.native && obj.native.members) {
            let count = 0;
            obj.native.members.forEach((member, i) => {
                count++;
                adapter.getForeignState(member.id, (err, state) => {
                    console.log('ID ' + member.id + '=' + (state ? state.val : state));
                    count--;
                    if (isForTrue) {
                        obj.native.members[i].setIfTrue  = state ? state.val : null;
                    } else {
                        obj.native.members[i].setIfFalse = state ? state.val : null;
                    }
                    if (!count) {
                        adapter.setForeignObject(sceneID, obj, err => {
                            if (err) {
                                adapter.log.error('Cannot save scene: ' + err);
                            } else {
                                adapter.log.info('Scene ' + obj.common.name + ' saved');
                            }
                            cb(err);
                        });
                    }
                });
            });
        } else {
            cb('Scene not found');
        }
    });
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

    schedule && Object.keys(cronTasks).forEach(id =>
        cronTasks[id] && cronTasks[id].cancel());
    cronTasks = {};

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

    main();
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
                    adapter.log.warn('Error while getting True/False states: ' +  e);
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

        adapter.log.debug('checkTrigger: ' + trigger.id + '(' + state.val + ') ' + trigger.condition + ' ' + val.toString());

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
                adapter.log.error('Unsupported condition: ' + trigger.condition);
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
                    adapter.log.debug('Cancel running timers (' + timers[stateObj.id].length + ' for ' + stateObj.id);
                    timers[stateObj.id].forEach(item => clearTimeout(item.timer));
                    timers[stateObj.id] = [];
                }
                tIndex++;

                // Start timeout
                const timer = setTimeout(async (id, setValue, _tIndex) => {
                    adapter.log.debug('Set delayed state for "' + sceneId + '": ' + id + ' = ' + setValue);

                    // execute timeout
                    if (stateObj.doNotOverwrite) {
                        adapter.getForeignState(id, (err, state) => {
                            // Set new state only if differ from desired state
                            if (!state || state.val !== setValue) {
                                adapter.setForeignState(id, setValue);
                            }
                        });
                    } else {
                        adapter.setForeignState(id, setValue);
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
                // Set desired state
                if (stateObj.doNotOverwrite) {
                    adapter.getForeignState(stateObj.id, (err, state) => {
                        // Set new state only if differ from desired state
                        if (!state || state.val !== desiredValue) {
                            adapter.setForeignState(stateObj.id, desiredValue);
                        }
                    });
                } else {
                    adapter.setForeignState(stateObj.id, desiredValue);
                }
            }
        })
        .catch(e =>
            adapter.log.error(`Cannot read setValue from ${desiredValue.replace(/^\s*{{/, '').replace(/}}\s*$/, '')}: ${e}`));
}

// Set all states of the state with interval
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

    scenesTimeout[sceneId + '_' + state] = setTimeout(() => {
        scenesTimeout[sceneId + '_' + state] = null;
        activateSceneState(sceneId, state, isTrue);
        activateSceneStates(sceneId, state + 1, isTrue, interval, callback);
    }, interval);
}

function activateScene(sceneId, isTrue) {
    adapter.log.debug('activateScene: execute for "' + sceneId + '" (' + isTrue + ')');

    if (!scenes[sceneId]) {
        adapter.log.error(`Unexpected error: Scene "${sceneId}" does not exist!`);
        return;
    }

    scenes[sceneId].native.burstInterval = parseInt(scenes[sceneId].native.burstInterval, 10);

    // all commands must be executed without interval
    if (!scenes[sceneId].native.burstInterval) {
        for (let state = 0; state < scenes[sceneId].native.members.length; state++) {
            activateSceneState(sceneId, state, isTrue);
        }

        if (!scenes[sceneId].native.virtualGroup) {
            if (scenes[sceneId].native.onFalse && scenes[sceneId].native.onFalse.enabled) {
                if (scenes[sceneId].value.val !== isTrue || !scenes[sceneId].value.ack) {
                    adapter.log.debug('activateScene: new state for "' + sceneId + '" is "' + isTrue + '"');
                    scenes[sceneId].value.val = isTrue;
                    scenes[sceneId].value.ack = true;
                    adapter.setForeignState(sceneId, isTrue, true);
                }
            } else if (scenes[sceneId].value.val !== true || !scenes[sceneId].value.ack) {
                adapter.log.debug('activateScene: new state for "' + sceneId + '" is "true"');
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
                    adapter.log.debug('activateScene: new state for "' + sceneId + '" is "' + isTrue + '"');
                    scenes[sceneId].value.val = isTrue;
                    scenes[sceneId].value.ack = true;
                    adapter.setForeignState(sceneId, isTrue, true);
                }
            } else if (scenes[sceneId].value.val !== true || !scenes[sceneId].value.ack) {
                adapter.log.debug('activateScene: new state for "' + sceneId + '" is "true"');
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
    if (!sStruct) return;
    if (sStruct.enabled === false) return;

    // remember triggers for true
    if (sStruct.trigger && sStruct.trigger.id) {
        usedIds.push(sStruct.trigger.id);
        triggers[sStruct.trigger.id] = triggers[sStruct.trigger.id] || [];
        if (triggers[sStruct.trigger.id].indexOf(sceneId) === -1) {
            triggers[sStruct.trigger.id].push(sceneId);
        }
    }
    // initiate cron tasks
    if (sStruct.cron) {
        schedule = schedule || require('node-schedule');

        adapter.log.debug(`Initiate cron task for ${sceneId}(${isTrue}): ${sStruct.cron}`);

        cronTasks[sceneId] = schedule.scheduleJob(sStruct.cron, () => {
            adapter.log.debug(`cron for ${sceneId}(${isTrue}): ${sStruct.cron}`);
            activateScene(sceneId, isTrue);
        });
    }

    return usedIds;
}

function initScenes() {
    const countIds = [];

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
            if (ids[stateId].indexOf(sceneId) === -1) ids[stateId].push(sceneId);

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

    // If requested more than 20 ids => get all of them
    if (countIds.length > 20) {
        adapter.log.debug('initScenes: subscribe on all');

        adapter.subscribeForeignStates();
    } else {
        // subscribe for own scenes
        adapter.subscribeForeignStates('scene.*');
        subscription = countIds;
        // and for all states
        for (let i = 0; i < countIds.length; i++) {
            adapter.log.debug('initScenes: subscribe on ' + countIds[i]);
            adapter.subscribeForeignStates(countIds[i]);
        }
    }
}

function main() {
    // Read all scenes
    adapter.getForeignObjects('scene.*', 'state', (err, states) => {
        if (states) {
            for (const id in states) {
                // ignore if no states involved
                if (!states.hasOwnProperty(id) || !states[id].native || !states[id].native.members || !states[id].native.members.length) {
                    continue;
                }
                // ignore if scene is disabled
                if (!states[id].common.enabled) {
                    continue;
                }
                // ignore if another instance
                if (states[id].common.engine !== 'system.adapter.' + adapter.namespace) {
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
            }
        }
        initScenes();
    });
}

// If started as allInOne mode => return function to create instance
if (module && module.parent) {
    module.exports = startAdapter;
} else {
    // or start the instance directly
    startAdapter();
}

