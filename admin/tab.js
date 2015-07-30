function Scenes(main) {
    var that = this;

    this.curRepository =         null;
    this.curRepoLastUpdate =     null;
    this.curInstalled =          null;
    this.list = [];
    this.$grid =  $('#grid-scenes');
    this.main = main;
    this.tree = [];
    this.data = {};
    this.engines = [];
    this.filterVals = {length: 0};
    this.currentFilter = '';
    this.isCollapsed = {};

    this.prepare = function () {
        that.$grid.fancytree({
            extensions: ["table", "gridnav", "filter", "themeroller"],
            checkbox: false,
            table: {
                indentation: 20      // indent 20px per node level
            },
            source: that.tree,
            renderColumns: function(event, data) {
                var node = data.node;
                var $tdList = $(node.tr).find(">td");
                var keys = node.key.split('_$$$_');

                $tdList.eq(0).css({'overflow': 'hidden', "white-space": "nowrap"});
                $tdList.eq(1).html(that.data[node.key].desc).css({'overflow': 'hidden', "white-space": "nowrap"});
                $tdList.eq(2).html(that.data[node.key].enabled).css({'overflow': 'hidden', "white-space": "nowrap"});

                $tdList.eq(3).html(that.data[node.key].must).css({'text-align': 'center', 'overflow': 'hidden', "white-space": "nowrap"});
                $tdList.eq(4).html(that.data[node.key].actual).css({'text-align': 'center', 'overflow': 'hidden', "white-space": "nowrap"});
                $tdList.eq(5).html(that.data[node.key].buttons).css({'text-align': 'center'});
                that.initButtons(keys[0], keys[1]);
                // If we render this element, that means it is expanded
                if (keys[1] !== undefined && that.isCollapsed[that.data[node.key].scene]) {
                    that.isCollapsed[that.data[node.key].scene] = false;
                    that.main.saveConfig('scenesIsCollapsed', JSON.stringify(that.isCollapsed));
                }
            },
            gridnav: {
                autofocusInput:   false,
                handleCursorKeys: true
            },
            filter: {
                mode: "hide",
                autoApply: true
            },
            collapse: function(event, data) {
                if (that.isCollapsed[data.node.key]) return;
                that.isCollapsed[data.node.key] = true;
                that.main.saveConfig('scenesIsCollapsed', JSON.stringify(that.isCollapsed));
            }
        });

        $('#btn_collapse_scenes').button({icons: {primary: 'ui-icon-folder-collapsed'}, text: false}).css({width: 18, height: 18}).unbind('click').click(function () {
            $('#process_running_scenes').show();
            setTimeout(function () {
                that.$grid.fancytree('getRootNode').visit(function (node) {
                    if (!that.filterVals.length || node.match || node.subMatch) node.setExpanded(false);
                });
                $('#process_running_scenes').hide();
            }, 100);
        });

        $('#btn_expand_scenes').button({icons: {primary: 'ui-icon-folder-open'}, text: false}).css({width: 18, height: 18}).unbind('click').click(function () {
            $('#process_running_scenes').show();
            setTimeout(function () {
                that.$grid.fancytree('getRootNode').visit(function (node) {
                    if (!that.filterVals.length || node.match || node.subMatch)
                        node.setExpanded(true);
                });
                $('#process_running_scenes').hide();
            }, 100);
        });

        // Load settings
        that.currentFilter = that.main.config.scenesCurrentFilter || '';
        that.isCollapsed = that.main.config.scenesIsCollapsed ? JSON.parse(that.main.config.scenesIsCollapsed) : {};
        $('#scenes-filter').val(that.currentFilter)

        $('#btn_refresh_scenes').button({icons: {primary: 'ui-icon-refresh'}, text: false}).css({width: 18, height: 18}).click(function () {
            that.init(true, true);
        });

        // add filter processing
        $('#scenes-filter').keyup(function () {
            $(this).trigger('change');
        }).on('change', function () {
            if (that.filterTimer) {
                clearTimeout(that.filterTimer);
            }
            that.filterTimer = setTimeout(function () {
                that.filterTimer = null;
                that.currentFilter = $('#scenes-filter').val();
                that.main.saveConfig('scenesCurrentFilter', that.currentFilter);
                that.$grid.fancytree('getTree').filterNodes(customFilter, false);
            }, 400);
        });

        $('#scenes-filter-clear').button({icons: {primary: 'ui-icon-close'}, text: false}).css({width: 16, height: 16}).click(function () {
            $('#scenes-filter').val('').trigger('change');
        });

        $('#btn_new_scene').button({icons: {primary: 'ui-icon-plus'}, text: false}).css({width: 16, height: 16}).click(function () {
            that.addNewScene();
        });
    };

    function customFilter(node) {
        //if (node.parent && node.parent.match) return true;

        if (that.currentFilter) {
            if (!that.data[node.key]) return false;

            if ((that.data[node.key].name     && that.data[node.key].name.toLowerCase().indexOf(that.currentFilter) != -1) ||
                (that.data[node.key].title    && that.data[node.key].title.toLowerCase().indexOf(that.currentFilter) != -1) ||
                (that.data[node.key].keywords && that.data[node.key].keywords.toLowerCase().indexOf(that.currentFilter) != -1) ||
                (that.data[node.key].desc     && that.data[node.key].desc.toLowerCase().indexOf(that.currentFilter) != -1)){
                return true;
            } else {
                return false;
            }
        } else {
            return true;
        }
    }

    this.resize = function (width, height) {
        $('#grid-scenes-div').height($(window).height() - $('#tabs .ui-tabs-nav').height() - 50);
    };

    this.addNewScene = function () {
        // find name
        var i = 1;
        while (this.list['scene.scene' + i]) i++;
        var id = 'scene.scene' + i;

        var scene = {
            "common": {
                "name":    _('scene') + ' ' + i,
                "type":    "boolean",
                "role":    "scene.state",
                "desc":    _('scene') + ' ' + i,
                "enabled": true,
                "engine":  this.engines[0]
            },
            "native": {
                "members": []
            },
            "type": "state"
        };

        this.main.socket.emit('setObject', id, scene, function (err, res) {
            if (err) this.main.showError(err);
        });
    };

    // ----------------------------- Scenes show and Edit ------------------------------------------------
    this.init = function (update) {
        if (!this.main.objectsLoaded) {
            setTimeout(function () {
                that.init();
            }, 250);
            return;
        }

        if (typeof this.$grid !== 'undefined' && (!this.$grid[0]._isInited || update)) {
            this.$grid[0]._isInited = true;

            $('#process_running_scenes').show();

            this.$grid.find('tbody').html('');

            that.tree = [];
            that.data = {};

            // list of the installed scenes
            for (var i = 0; i < this.list.length; i++) {
                var sceneId = this.list[i];
                that.data[sceneId] = {
                    id:       sceneId,
                    desc:     this.main.objects[sceneId].common.desc,
                    enabled:  this.main.objects[sceneId].native ? !this.main.objects[sceneId].native.disabled : false,
                    must:     '',
                    actual:   main.states[sceneId] ? main.states[sceneId].val : '',
                    buttons: '<button data-scene-name="' + sceneId + '" class="scene-add-state">'      + _('add states')   + '</button>' +
                             '<button data-scene-name="' + sceneId + '" class="scene-edit-submit">'    + _('edit scene')   + '</button>' +
                             '<button data-scene-name="' + sceneId + '" class="scene-delete-submit">'  + _('delete scene') + '</button>'
                };

                var scene = {
                    title:    sceneId,
                    key:      sceneId,
                    folder:   true,
                    expanded: !that.isCollapsed[sceneId],
                    children: []
                };
                that.tree.push(scene);

                if (this.main.objects[sceneId].native && this.main.objects[sceneId].native.members) {
                    var members = this.main.objects[sceneId].native.members;
                    for (var m = 0; m < members.length; m++) {
                        that.data[sceneId + '_$$$_' + m] = {
                            id:       members[m].id,
                            scene:    sceneId,
                            index:    m,
                            enabled:  !members[m].disabled,
                            must:     members[m].must,
                            actual:   main.states[members[m].id] ? main.states[members[m].id].val : '',
                            buttons: '<button data-scene-name="' + sceneId + '" data-state-index="' + m + '" class="scene-state-edit-submit">'   + _('edit state')   + '</button>' +
                                     '<button data-scene-name="' + sceneId + '" data-state-index="' + m + '" class="scene-state-delete-submit">' + _('delete state') + '</button>'
                        };
                        scene.children.push({
                            title:    members[m].id,
                            key:      sceneId + '_$$$_' + m
                        });
                    }
                }
            }

            that.$grid.fancytree('getTree').reload(that.tree);
            $('#grid-scenes .fancytree-icon').each(function () {
                if ($(this).attr('src')) $(this).css({width: 22, height: 22});
            });
            $('#process_running_scenes').hide();
            if (that.currentFilter) that.$grid.fancytree('getTree').filterNodes(customFilter, false);

        }
    };

    this.initButtons = function (scene, m) {
        $('.scene-add-state[data-scene-name="' + scene + '"]').button({
            text: false,
            icons: {
                primary: 'ui-icon-plusthick'
            }
        }).css('width', '22px').css('height', '18px').unbind('click').on('click', function () {
            var scene = $(this).attr('data-scene-name');
            var sid = that.main.initSelectId();
            sid.selectId('show', function (newIds) {
                if (newIds && newIds.length) {
                    var obj = that.main.objects[scene];
                    for (var i = 0; i < newIds.length; i++) {
                        if (!obj.native.members) obj.native.members = [];
                        obj.native.members.push({id: newIds[i], must: null});
                    }

                    that.main.socket.emit('setObject', scene, obj, function (err) {
                        if (err) this.main.showError(err);
                    });
                }
            });
        });

        $('.scene-delete-submit[data-scene-name="' + scene + '"]').button({
            icons: {primary: 'ui-icon-trash'},
            text:  false
        }).css('width', '22px').css('height', '18px').unbind('click').on('click', function () {
            var scene = $(this).attr('data-scene-name');

            // TODO: are you sure?
            that.main.socket.emit('delObject', scene, function (err) {
                if (err) this.main.showError(err);
            });
        });

        $('.scene-edit-submit[data-scene-name="' + scene + '"]').button({
            icons: {primary: 'ui-icon-note'},
            text: false
        }).css('width', '22px').css('height', '18px').unbind('click').on('click', function () {
            var scene = $(this).attr('data-scene-name');
        });

        if (m !== undefined) {
            $('.scene-state-edit-submit[data-scene-name="' + scene + '"][data-state-index="' + m + '"]').button({
                icons: {primary: 'ui-icon-note'},
                text:  false
            }).css('width', '22px').css('height', '18px').unbind('click').on('click', function () {
                var scene = $(this).attr('data-scene-name');
                var index = $(this).attr('data-state-index');

            });

            $('.scene-state-delete-submit[data-scene-name="' + scene + '"][data-state-index="' + m + '"]').button({
                icons: {primary: 'ui-icon-trash'},
                text:  false
            }).css('width', '22px').css('height', '18px').unbind('click').on('click', function () {
                var scene = $(this).attr('data-scene-name');
                var index = $(this).attr('data-state-index');

                var obj = that.main.objects[scene];
                obj.native.members.splice(index, 1);

                that.main.socket.emit('setObject', scene, obj, function (err) {
                    if (err) this.main.showError(err);
                });
            });
        }
    };

    this.objectChange = function (id, obj) {
        // update engines
        if (id.match(/^system\.adapter\.scenes\.\d+$/)) {
            if (obj) {
                if (this.engines.indexOf(id) == -1) {
                    this.engines.push(id);
                    if (typeof this.$grid != 'undefined' && this.$grid[0]._isInited) {
                        this.init(true);
                    }
                    return;
                }
            } else {
                var pos = this.engines.indexOf(id);
                if (pos != -1) {
                    this.engines.splice(pos, 1);
                    if (typeof this.$grid != 'undefined' && this.$grid[0]._isInited) {
                        this.init(true);
                    }
                    return;
                }
            }
        }

        // Update Scene Table
        if (id.match(/^scene\..+$/)) {
            if (obj) {
                if (this.list.indexOf(id) == -1) this.list.push(id);
            } else {
                var j = this.list.indexOf(id);
                if (j != -1) this.list.splice(j, 1);
            }

            if (typeof this.$grid != 'undefined' && this.$grid[0]._isInited) {
                this.init(true);
            }
        }
    };
}

var main = {
    socket:         io.connect(),
    saveConfig:     function (attr, value) {
        if (!main.config) return;
        if (attr) main.config[attr] = value;

        if (typeof storage != 'undefined') {
            storage.set('adminConfig', JSON.stringify(main.config));
        }
    },
    showError:      function (error) {
        main.showMessage(_(error),  _('Error'), 'alert');
    },
    showMessage:    function (message, title, icon) {
        $dialogMessage.dialog('option', 'title', title || _('Message'));
        $('#dialog-message-text').html(message);
        if (icon) {
            $('#dialog-message-icon').show();
            $('#dialog-message-icon').attr('class', '');
            $('#dialog-message-icon').addClass('ui-icon ui-icon-' + icon);
        } else {
            $('#dialog-message-icon').hide();
        }
        $dialogMessage.dialog('open');
    },
    confirmMessage: function (message, title, icon, callback) {
        $dialogConfirm.dialog('option', 'title', title || _('Message'));
        $('#dialog-confirm-text').html(message);
        if (icon) {
            $('#dialog-confirm-icon').show();
            $('#dialog-confirm-icon').attr('class', '');
            $('#dialog-confirm-icon').addClass('ui-icon ui-icon-' + icon);
        } else {
            $('#dialog-confirm-icon').hide();
        }
        $dialogConfirm.data('callback', callback);
        $dialogConfirm.dialog('open');
    },
    initSelectId:   function () {
        if (main.selectId) return main.selectId;
        main.selectId = $('#dialog-select-member').selectId('init',  {
            objects: main.objects,
            states:  main.states,
            noMultiselect: false,
            imgPath: '../../lib/css/fancytree/',
            filter: {type: 'state'},
            texts: {
                select:   _('Select'),
                cancel:   _('Cancel'),
                all:      _('All'),
                id:       _('ID'),
                name:     _('Name'),
                role:     _('Role'),
                room:     _('Room'),
                value:    _('Value'),
                selectid: _('Select ID'),
                from:     _('From'),
                lc:       _('Last changed'),
                ts:       _('Time stamp'),
                wait:     _('Processing...'),
                ack:      _('Acknowledged')
            },
            columns: ['image', 'name', 'role', 'room', 'value']
        });
        return main.selectId;
    },
    objects:        {},
    states:         {},
    currentHost:    '',
    instances:      [],
    objectsLoaded:  false,
    waitForRestart: false,
    selectId:       null
};

var $dialogMessage =        $('#dialog-message');
var $dialogConfirm =        $('#dialog-confirm');

// Read all positions, selected widgets for every view,
// Selected view, selected menu page,
// Selected widget or view page
// Selected filter
if (typeof storage != 'undefined') {
    try {
        main.config = storage.get('adminConfig');
        if (main.config) {
            main.config = JSON.parse(main.config);
        } else {
            main.config = {};
        }
    } catch (e) {
        console.log('Cannot load edit config');
        main.config = {};
    }
}
var firstConnect = true;
var scenes  = new Scenes(main);

function getStates(callback) {
    main.socket.emit('getStates', function (err, res) {
        main.states = res;
        if (typeof callback === 'function') {
            setTimeout(function () {
                callback();
            }, 0);
        }
    });
}

function getObjects(callback) {
    main.socket.emit('getObjects', function (err, res) {
        setTimeout(function () {
            var obj;
            main.objects = res;
            for (var id in main.objects) {
                obj = res[id];
                if (id.match(/^system\.adapter\.scenes\.\d+$/)) {
                    scenes.engines.push(id);
                }

                if (obj.type === 'state' && id.match(/^scene\..+/)) {
                    scenes.list.push(id);
                }
            }
            main.objectsLoaded = true;

            scenes.prepare();
            scenes.init();

            $(window).resize(function () {
                var x = $(window).width();
                var y = $(window).height();
                if (x < 720) {
                    x = 720;
                }
                if (y < 480) {
                    y = 480;
                }

                scenes.resize(x, y);
            });
            $(window).trigger('resize');

            if (typeof callback === 'function') callback();
        }, 0);
    });
}

function objectChange(id, obj) {
    var changed  = false;
    var oldObj   = null;
    var isNew    = false;
    var isUpdate = false;
    var i;
    var j;

    // update main.objects cache
    if (obj) {
        if (obj._rev && main.objects[id]) main.objects[id]._rev = obj._rev;
        if (!main.objects[id]) {
            isNew = true;
            //treeInsert(id);
        }
        if (isNew || JSON.stringify(main.objects[id]) != JSON.stringify(obj)) {
            main.objects[id] = obj;
            changed = true;
        }
    } else if (main.objects[id]) {
        changed = true;
        oldObj = {_id: id, type: main.objects[id].type};
        delete main.objects[id];
    }

    if (main.selectId) main.selectId.selectId('object', id, obj);

    scenes.objectChange(id, obj);
}

function stateChange(id, state) {
    var rowData;
    id = id ? id.replace(/ /g, '_') : '';

    if (!id || !id.match(/\.messagebox$/)) {
        if (main.selectId) main.selectId.selectId('state', id, state);
    }
}

main.socket.on('permissionError', function (err) {
    main.showMessage(_('Has no permission to %s %s %s', err.operation, err.type, (err.id || '')));
});
main.socket.on('objectChange', function (id, obj) {
    setTimeout(objectChange, 0, id, obj);
});
main.socket.on('stateChange', function (id, obj) {
    setTimeout(stateChange, 0, id, obj);
});
main.socket.on('connect', function () {
    $('#connecting').hide();
    if (firstConnect) {
        firstConnect = false;

        main.socket.emit('getUserPermissions', function (err, acl) {
            main.acl = acl;
            // Read system configuration
            main.socket.emit('getObject', 'system.config', function (err, data) {
                main.systemConfig = data;
                if (!err && main.systemConfig && main.systemConfig.common) {
                    systemLang = main.systemConfig.common.language;
                } else {
                    systemLang = window.navigator.userLanguage || window.navigator.language;

                    if (systemLang !== 'en' && systemLang !== 'de' && systemLang !== 'ru') {
                        main.systemConfig.common.language = 'en';
                        systemLang = 'en';
                    }
                }

                translateAll();

                $dialogMessage.dialog({
                    autoOpen: false,
                    modal:    true,
                    buttons: [
                        {
                            text: _('Ok'),
                            click: function () {
                                $(this).dialog("close");
                            }
                        }
                    ]
                });

                $dialogConfirm.dialog({
                    autoOpen: false,
                    modal:    true,
                    buttons: [
                        {
                            text: _('Ok'),
                            click: function () {
                                var cb = $(this).data('callback');
                                $(this).dialog('close');
                                if (cb) cb(true);
                            }
                        },
                        {
                            text: _('Cancel'),
                            click: function () {
                                var cb = $(this).data('callback');
                                $(this).dialog('close');
                                if (cb) cb(false);
                            }
                        }

                    ]
                });

                getStates(getObjects);
            });
        });
    }
    if (main.waitForRestart) {
        location.reload();
    }
});
main.socket.on('disconnect', function () {
    $('#connecting').show();
});
main.socket.on('reconnect', function () {
    $('#connecting').hide();
    if (main.waitForRestart) {
        location.reload();
    }
});
main.socket.on('reauthenticate', function () {
    location.reload();
});