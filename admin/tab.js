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
    this.isList = false;
    this.filterVals = {length: 0};
    this.onlyInstalled = false;
    this.onlyUpdatable = false;
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

                if (!that.data[node.key]) {
                    $tdList.eq(0).css({'font-weight': 'bold'});
                    //$(node.tr).addClass('ui-state-highlight');

                    // Calculate total count of scene and count of installed scene
                    for (var c = 0; c < that.tree.length; c++) {
                        if (that.tree[c].key == node.key) {
                            var installed = 0;
                            for (var k = 0; k < that.tree[c].children.length; k++) {
                                if (that.data[that.tree[c].children[k].key].installed) installed++;
                            }
                            var title;
                            if (!that.onlyInstalled && !that.onlyUpdatable) {
                                title = '[<span title="' + _('Installed from group') + '">' + installed + '</span> / <span title="' + _('Total count in group') + '">' + that.tree[c].children.length + '</span>]';
                            } else {
                                title = '<span title="' + _('Installed from group') + '">' + installed + '</span>';
                            }
                            $tdList.eq(4).html(title).css({'text-align': 'center', 'overflow': 'hidden', "white-space": "nowrap"});
                            break;
                        }
                    }
                    return;
                }
                $tdList.eq(0).css({'overflow': 'hidden', "white-space": "nowrap"});
                $tdList.eq(1).html(that.data[node.key].desc).css({'overflow': 'hidden', "white-space": "nowrap"});
                $tdList.eq(2).html(that.data[node.key].keywords).css({'overflow': 'hidden', "white-space": "nowrap"}).attr('title', that.data[node.key].keywords);

                $tdList.eq(3).html(that.data[node.key].version).css({'text-align': 'center', 'overflow': 'hidden', "white-space": "nowrap"});
                $tdList.eq(4).html(that.data[node.key].installed).css({'padding-left': '10px', 'overflow': 'hidden', "white-space": "nowrap"});
                $tdList.eq(5).html(that.data[node.key].platform).css({'text-align': 'center', 'overflow': 'hidden', "white-space": "nowrap"});
                $tdList.eq(6).html(that.data[node.key].license).css({'text-align': 'center', 'overflow': 'hidden', "white-space": "nowrap"});
                $tdList.eq(7).html(that.data[node.key].install).css({'text-align': 'center'});
                that.initButtons(node.key);
                // If we render this element, that means it is expanded
                if (that.isCollapsed[that.data[node.key].group]) {
                    that.isCollapsed[that.data[node.key].group] = false;
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
    }

    // ----------------------------- Adpaters show and Edit ------------------------------------------------
    this.init = function (update, updateRepo) {
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

            this.getScenesInfo(this.main.currentHost, update, updateRepo, function (repository, installedList) {
                var id = 1;
                var obj;
                var version;
                var tmp;
                var scene;

                var listInstalled = [];
                var listUnsinstalled = [];

                if (installedList) {
                    for (scene in installedList) {
                        obj = installedList[scene];
                        if (!obj || obj.controller || scene == 'hosts') continue;
                        listInstalled.push(scene);
                    }
                    listInstalled.sort();
                }

                // List of scenes for repository
                for (scene in repository) {
                    obj = repository[scene];
                    if (!obj || obj.controller) continue;
                    version = '';
                    if (installedList && installedList[scene]) continue;
                    listUnsinstalled.push(scene);
                }
                listUnsinstalled.sort();

                that.tree = [];
                that.data = {};

                // list of the installed scenes
                for (var i = 0; i < listInstalled.length; i++) {
                    scene = listInstalled[i];
                    obj = installedList ? installedList[scene] : null;
                    if (!obj || obj.controller || scene == 'hosts') continue;
                    var installed = '';
                    var icon = obj.icon;
                    version = '';

                    if (repository[scene] && repository[scene].version) version = repository[scene].version;

                    if (repository[scene] && repository[scene].extIcon) icon = repository[scene].extIcon;

                    if (obj.version) {
                        installed = '<table style="border: 0px;border-collapse: collapse;" cellspacing="0" cellpadding="0" class="ui-widget"><tr><td style="border: 0px;padding: 0;width:50px">' + obj.version + '</td>';

                        var _instances = 0;
                        var _enabled   = 0;

                        // Show information about installed and enabled instances
                        for (var z = 0; z < that.main.instances.length; z++) {
                            if (main.objects[that.main.instances[z]].common.name == scene) {
                                _instances++;
                                if (main.objects[that.main.instances[z]].common.enabled) _enabled++;
                            }
                        }
                        if (_instances) {
                            installed += '<td style="border: 0px;padding: 0;width:40px">[<span title="' + _('Installed instances') + '">' + _instances + '</span>';
                            if (_enabled) installed += '/<span title="' + _('Active instances') + '" style="color: green">' + _enabled + '</span>';
                            installed += ']</td>';
                        } else {
                            installed += '<td style="border: 0px;padding: 0;width:40px"></td>';
                        }

                        tmp = installed.split('.');
                        if (!that.main.upToDate(version, obj.version)) {
                            installed += '<td style="border: 0px;padding: 0;width:30px"><button class="scene-update-submit" data-scene-name="' + scene + '">' + _('update') + '</button></td>';
                            version = version.replace('class="', 'class="updateReady ');
                            $('a[href="#tab-scenes"]').addClass('updateReady');
                        } else if (that.onlyUpdatable) {
                            continue;
                        }

                        installed += '</tr></table>';
                    }
                    if (version) {
                        tmp = version.split('.');
                        if (tmp[0] === '0' && tmp[1] === '0' && tmp[2] === '0') {
                            version = '<span class="planned" title="' + _("planned") + '">' + version + '</span>';
                        } else if (tmp[0] === '0' && tmp[1] === '0') {
                            version = '<span class="alpha" title="' + _("alpha") + '">' + version + '</span>';
                        } else if (tmp[0] === '0') {
                            version = '<span class="beta" title="' + _("beta") + '">' + version + '</span>';
                        } else {
                            version = '<span class="stable" title="' + _("stable") + '">' + version + '</span>';
                        }
                    }

                    that.data[scene] = {
                        image:      icon ? '<img src="' + icon + '" width="22px" height="22px" />' : '',
                        name:       scene,
                        title:      obj.title,
                        desc:       (typeof obj.desc === 'object') ? (obj.desc[systemLang] || obj.desc.en) : obj.desc,
                        keywords:   obj.keywords ? obj.keywords.join(' ') : '',
                        version:    version,
                        installed:  installed,
                        install: '<button data-scene-name="' + scene + '" class="scene-install-submit">' + _('add instance') + '</button>' +
                            '<button ' + (obj.readme ? '' : 'disabled="disabled" ') + 'data-scene-name="' + scene + '" data-scene-url="' + obj.readme + '" class="scene-readme-submit">' + _('readme') + '</button>' +
                            '<button ' + (installed ? '' : 'disabled="disabled" ') + 'data-scene-name="' + scene + '" class="scene-delete-submit">' + _('delete scene') + '</button>',
                        platform:   obj.platform,
                        group:      (obj.type || that.types[scene] || 'common scenes') + '_group',
                        license:    obj.license || '',
                        licenseUrl: obj.licenseUrl || ''
                    };

                    if (!obj.type) console.log('"' + scene + '": "common scenes",');
                    if (obj.type && that.types[scene]) console.log('Scene "' + scene + '" has own type. Remove from admin.');

                    if (!that.isList) {
                        var igroup = -1;
                        for (var j = 0; j < that.tree.length; j++){
                            if (that.tree[j].key == that.data[scene].group) {
                                igroup = j;
                                break;
                            }
                        }
                        if (igroup < 0) {
                            that.tree.push({
                                title:    _(that.data[scene].group),
                                key:      that.data[scene].group,
                                folder:   true,
                                expanded: !that.isCollapsed[that.data[scene].group],
                                children: [],
                                icon:     that.groupImages[that.data[scene].group]
                            });
                            igroup = that.tree.length - 1;
                        }
                        that.tree[igroup].children.push({
                            icon:     icon,
                            title:    that.data[scene].title || scene,
                            key:      scene
                        });
                    } else {
                        that.tree.push({
                            icon:     icon,
                            title:    that.data[scene].title || scene,
                            key:      scene
                        });
                    }
                }

                if (!that.onlyInstalled && !that.onlyUpdatable) {
                    for (i = 0; i < listUnsinstalled.length; i++) {
                        scene = listUnsinstalled[i];

                        obj = repository[scene];
                        if (!obj || obj.controller) continue;
                        version = '';
                        if (installedList && installedList[scene]) continue;

                        if (repository[scene] && repository[scene].version) {
                            version = repository[scene].version;
                            tmp = version.split('.');
                            if (tmp[0] === '0' && tmp[1] === '0' && tmp[2] === '0') {
                                version = '<span class="planned" title="' + _("planned") + '">' + version + '</span>';
                            } else if (tmp[0] === '0' && tmp[1] === '0') {
                                version = '<span class="alpha" title="' + _("alpha") + '">' + version + '</span>';
                            } else if (tmp[0] === '0') {
                                version = '<span class="beta" title="' + _("beta") + '">' + version + '</span>';
                            } else {
                                version = '<span class="stable" title="' + _("stable") + '">' + version + '</span>';
                            }
                        }

                        that.data[scene] = {
                            image:      repository[scene].extIcon ? '<img src="' + repository[scene].extIcon + '" width="22px" height="22px" />' : '',
                            name:       scene,
                            title:      obj.title,
                            desc:       (typeof obj.desc === 'object') ? (obj.desc[systemLang] || obj.desc.en) : obj.desc,
                            keywords:   obj.keywords ? obj.keywords.join(' ') : '',
                            version:    version,
                            installed:  '',
                            install: '<button data-scene-name="' + scene + '" class="scene-install-submit">' + _('add instance') + '</button>' +
                                '<button ' + (obj.readme ? '' : 'disabled="disabled" ') + ' data-scene-name="' + scene + '" data-scene-url="' + obj.readme + '" class="scene-readme-submit">' + _('readme') + '</button>' +
                                '<button disabled="disabled" data-scene-name="' + scene + '" class="scene-delete-submit">' + _('delete scene') + '</button>',
                            platform:   obj.platform,
                            license:    obj.license || '',
                            licenseUrl: obj.licenseUrl || '',
                            group:      (obj.type || that.types[scene] || 'common scenes') + '_group'
                        };

                        if (!obj.type) console.log('"' + scene + '": "common scenes",');
                        if (obj.type && that.types[scene]) console.log('Scene "' + scene + '" has own type. Remove from admin.');

                        if (!that.isList) {
                            var igroup = -1;
                            for (var j = 0; j < that.tree.length; j++){
                                if (that.tree[j].key == that.data[scene].group) {
                                    igroup = j;
                                    break;
                                }
                            }
                            if (igroup < 0) {
                                that.tree.push({
                                    title:    _(that.data[scene].group),
                                    key:      that.data[scene].group,
                                    folder:   true,
                                    expanded: !that.isCollapsed[that.data[scene].group],
                                    children: [],
                                    icon:     that.groupImages[that.data[scene].group]
                                });
                                igroup = that.tree.length - 1;
                            }
                            that.tree[igroup].children.push({
                                title:    that.data[scene].title || scene,
                                icon:     repository[scene].extIcon,
                                key:      scene
                            });
                        } else {
                            that.tree.push({
                                icon:     repository[scene].extIcon,
                                title:    that.data[scene].title || scene,
                                key:      scene
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
            });
        }
    };

    this.initButtons = function (scene) {
        $('.scene-install-submit[data-scene-name="' + scene + '"]').button({
            text: false,
            icons: {
                primary: 'ui-icon-plusthick'
            }
        }).css('width', '22px').css('height', '18px').unbind('click').on('click', function () {
            var scene = $(this).attr('data-scene-name');
            that.getScenesInfo(that.main.currentHost, false, false, function (repo, installed) {
                var obj = repo[scene];

                if (!obj) obj = installed[scene];

                if (!obj) return;

                if (obj.license && obj.license !== 'MIT') {
                    // Show license dialog!
                    showLicenseDialog(scene, function (isAgree) {
                        if (isAgree) {
                            that.main.cmdExec(null, 'add ' + scene, function (exitCode) {
                                if (!exitCode) that.init(true);
                            });
                        }
                    });
                } else {
                    that.main.cmdExec(null, 'add ' + scene, function (exitCode) {
                        if (!exitCode) that.init(true);
                    });
                }
            });
        });

        $('.scene-delete-submit[data-scene-name="' + scene + '"]').button({
            icons: {primary: 'ui-icon-trash'},
            text:  false
        }).css('width', '22px').css('height', '18px').unbind('click').on('click', function () {
            that.main.cmdExec(null, 'del ' + $(this).attr('data-scene-name'), function (exitCode) {
                if (!exitCode) that.init(true);
            });
        });

        $('.scene-readme-submit[data-scene-name="' + scene + '"]').button({
            icons: {primary: 'ui-icon-help'},
            text: false
        }).css('width', '22px').css('height', '18px').unbind('click').on('click', function () {
            window.open($(this).attr('data-scene-url'), $(this).attr('data-scene-name') + ' ' + _('readme'));
        });

        $('.scene-update-submit[data-scene-name="' + scene + '"]').button({
            icons: {primary: 'ui-icon-refresh'},
            text:  false
        }).css('width', '22px').css('height', '18px').unbind('click').on('click', function () {
            var aName = $(this).attr('data-scene-name');
            if (aName == 'admin') that.main.waitForRestart = true;

            that.main.cmdExec(null, 'upgrade ' + aName, function (exitCode) {
                if (!exitCode) that.init(true);
            });
        });
    };

    this.objectChange = function (id, obj) {
        // Update Scene Table
        if (id.match(/^system\.scene\.[a-zA-Z0-9-_]+$/)) {
            if (obj) {
                if (this.list.indexOf(id) == -1) this.list.push(id);
            } else {
                var j = this.list.indexOf(id);
                if (j != -1) {
                    this.list.splice(j, 1);
                }
            }

            if (typeof this.$grid != 'undefined' && this.$grid[0]._isInited) {
                this.init(true);
            }
        }
    }
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
            noMultiselect: true,
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
                if (obj.type !== 'state') continue;

                obj = res[id];
                if (obj === 'state') {
                    if (id.match(/^scene\.\d+\.)) {
                        scenes.list.push(id);
                    }
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
    var changed = false;
    var i;
    var j;
    var oldObj = null;
    var isNew = false;
    var isUpdate = false;

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

    if (id.match(/^system\.scene\.[-\w]+\.[0-9]+$/)) {
        // Disable scenes tab if no one script engine instance found
        var engines = scenes.fillEngines();
        $('#tabs').tabs('option', 'disabled', (engines && engines.length) ? [] : [4]);
    }

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
                initGridLanguage(main.systemConfig.common.language);

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