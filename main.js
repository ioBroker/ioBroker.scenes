/* jshint -W097 */// jshint strict:false
/*jslint node: true */
"use strict";

var utils   = require(__dirname + '/lib/utils'); // Get common adapter utils
var adapter = utils.adapter('scenes');

adapter.on('stateChange', function (id, state) {
    if (state) {
        if (!state.ack) {
            if (scenes[id]) {
                // activate scene
                return;
            }
        }

        if (ids[id]) {
            for (var s = 0; s < ids[id].length; s++) {
                checkScene(ids[id][s], id, state);
            }
        }
    }
});

adapter.on('ready', function () {
    main();
});

var scenes = {};
var ids    = {};

function checkScene(sceneId, stateId, state) {

    var active = null;
    for (var i = 0; i < scenes[sceneId].length; i++) {
        if (active === null) active = true;
        if (stateId && scenes[sceneId][i].id == stateId) {
            scenes[sceneId][i].actual = state.val;
        }

        if (scenes[sceneId][i].must != scenes[sceneId][i].actual) {
            active = false;
            break;
        }
    }
    if (active !== null) {
        adapter.setState(sceneId, active, true);
    }
}

function getState(sceneId, stateNumber) {
    var stateId = scenes[sceneId][stateNumber].id;
    adapter.getForeignState(stateId, function (err, state) {
        scenes[sceneId][stateNumber].actual = state ? state.val : null;
        scenes[sceneId].count--;

        // If processing finshed
        if (!scenes[sceneId][scenes[sceneId].length - 1].count) {
            scenes[sceneId].splice(scenes[sceneId].length - 1, 1);
            checkScene(sceneId);
        }
    });
}

function initScenes() {
    var countIds = [];

    // list all scenes in Object
    for (var sceneId in scenes) {
        scenes[sceneId].push({count: 0});
        // Go through all states in Array
        for (var state = 0; state < scenes[sceneId].length - 1; state++) {
            var stateId = scenes[sceneId][state].id;
            // calculate subscribtions
            if (countIds.indexOf(stateId) == -1) countIds.push(stateId);

            // remember which scenes uses this state
            ids[stateId] = ids[stateId] || [];
            if (ids[stateId].indexOf(sceneId) == -1) {
                ids[stateId].push(sceneId);
            }
            scenes[sceneId][scenes[sceneId].length - 1].count++;
            // read actual state
            getState(sceneId, state);
        }
    }

    // If requested more than 20 ids => get all of them
    if (countIds.length > 20) {
        adapter.subscribeForeignStates();
    } else {
        // subscribe for own scenes
        adapter.subscribeStates();
        // and for all states
        for (var i = 0; i < countIds.length; i++) {
            adapter.subscribeForeignStates(countIds[i]);
        }
    }
}

function main() {
    // Read all scenes
    adapter.getStatesOf(function (err, states) {
        if (states) {
            for (var i = 0; i < states.length; i++) {
                if (!states[i].native || !states[i].native.members) continue;

                scenes[states[i]._id] = {};

                scenes[states[i]._id] = states[i].native.members;
                for (var m = 0; m < states[i].native.members.length; m++) {
                    scenes[states[i]._id][m].actual = null;
                }
            }
        }
        initScenes();
    });
}

