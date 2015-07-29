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

    if (stateId) scenes[sceneId][stateId].actual = state.val;

    var active = null;
    for (var id in scenes[sceneId]) {
        if (active === null) active = true;
        if (scenes[sceneId][id].must != scenes[sceneId][id].actual) {
            active = false;
            break;
        }
    }
    if (active !== null) {
        adapter.setState(sceneId, active, true);
    }
}

function getState(sceneId, stateId) {
    adapter.getForeignState(stateId, function (err, state) {
        scenes[sceneId][stateId].actual = state ? state.val : null;
        scenes[sceneId].count--;
        if (!scenes[sceneId].count) {
            delete scenes[sceneId].count;
            checkScene(sceneId);
        }
    });
}

function initScenes() {
    var countIds = [];
    for (var sceneId in scenes) {
        scenes[sceneId].count = 0;
        for (var stateId in scenes[sceneId]) {
            if (sceneId == 'count') continue;

            countIds.push(stateId);
            ids[stateId] = ids[stateId] || [];
            ids[stateId].push(sceneId);
            scenes[sceneId].count++;
            getState(sceneId, stateId);
        }
    }

    // If requested more than 20 ids => get all of them
    if (countIds.length > 20) {
        adapter.subscribeForeignStates();
    } else {
        adapter.subscribeStates();
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

                for (var m in states[i].native.members) {
                    scenes[states[i]._id][m] = {actual: null, must: states[i].native.members[m]};
                }
            }
        }
        initScenes();
    });
}

