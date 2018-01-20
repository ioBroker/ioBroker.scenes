function Scenes(main) {
    var that = this;

    this.list = [];
    this.$grid =  $('#grid-scenes');
    this.main = main;
    this.tree = [];
    this.data = {};
    this.engines = [];
    this.filterVals = {length: 0};
    this.currentFilter = '';
    this.isCollapsed = {};
    this.$dialogState   = $('#dialog-state');
    this.$dialogScene   = $('#dialog-scene');
    this.$dialogReplace = $('#dialog-replace');
    this.timers = {};

    function installColResize() {
        if (!$.fn.colResizable) return;
        var $gridScenes = $('#grid-scenes');
        if ($gridScenes.is(':visible')) {
            $gridScenes.colResizable({
                liveDrag: true
            });
        } else {
            setTimeout(function () {
                installColResize();
            }, 400)
        }
    }

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

                if (!that.data[keys[0]].enabled) $(node.tr).css('opacity', 0.5);

                $tdList.eq(0).css({'overflow': 'hidden', "white-space": "nowrap"});
                var text = '<input ' + (that.data[node.key].enabled ? 'checked' : '') + ' type="checkbox" data-scene-name="' + keys[0] + '" ' + (keys[1] !== undefined ? ('data-state-index="' + keys[1]) + '" class="state-edit-enabled"': ' class="scene-edit-enabled"') + '>';
                $tdList.eq(1).html(text).css({'text-align': 'center', "white-space": "nowrap"});
                $tdList.eq(2).html(that.data[node.key].name).css({'overflow': 'hidden', "white-space": "nowrap", 'font-weight': (keys[1] === undefined) ? 'bold' : '', 'padding-left': (keys[1] === undefined) ? '0' : '10'});
                $tdList.eq(3).html(that.data[node.key].desc).css({'overflow': 'hidden', "white-space": "nowrap", 'font-weight': (keys[1] === undefined) ? 'bold' : '', 'padding-left': (keys[1] === undefined) ? '0' : '10'});

                $tdList.eq(4).html(that.data[node.key].cond || '').css({'overflow': 'hidden', "white-space": "nowrap"});

                text = getActualText(node.key);

                var $eq5 = $tdList.eq(5);
                if (keys[1] !== undefined) {
                    text = '<span class="state-value" data-scene-name="' + keys[0] + '" data-state-index="' + keys[1] + '" data-state="' + that.data[node.key].id + '">' + text + '</span>';
                    $eq5.html(text).css({'text-align': 'center', 'overflow': 'hidden', "white-space": "nowrap"});
                    if (!that.data[node.key].delay) {
                        var background = getActualBackground(keys[0], keys[1]);
                        if (background === 'lightgreen') {

                            $eq5.css('background', 'lightgreen');
                            $eq5.attr('title', _('is equal'));

                        } else if (background === 'lightpink ') {

                            $eq5.css('background', 'lightpink ');
                            $eq5.attr('title', _('is equal with false'));

                        } else {

                            $eq5.css('background', '');
                            $eq5.attr('title', _('non equal'));

                        }
                    } else {
                        $eq5.css('background', '');
                        $eq5.attr('title', _('width delay'));
                    }
                } else {
                    text = '<span class="scene-value" data-scene-name="' + keys[0] + '" data-state="' + that.data[node.key].id + '">' + text + '</span>';
                    $eq5.html(text).css({'text-align': 'center', 'overflow': 'hidden', "white-space": "nowrap"});
                }

                // - set value
                if (!that.main.objects[keys[0]].native.virtualGroup) {
                if (keys[1] !== undefined) {
                    var obj   = that.main.objects[keys[0]];
                    var state = that.main.objects[obj.native.members[keys[1]].id];

                    if (state) {
                        if (state.common.type === 'boolean' || state.common.type === 'bool') {
                            text = '<input class="state-edit-setIfTrue" data-type="checkbox" type="checkbox" ' + (that.data[node.key].setIfTrue ? 'checked' : '') + ' data-scene-name="' + keys[0] + '" data-state-index="' + keys[1] + '"/>';
                        } else if (state.common.states && typeof state.common.states === 'object' && state.common.states.length) {
                            var select = '';
                            for (var s = 0; s < state.common.states.length; s++) {
                                select += '<option value="' + s + '" ' + ((obj.native.members[keys[1]].setIfTrue == s) ? 'selected' : '') + '>' + state.common.states[s] + '</option>';
                            }
                            text = '<select class="state-edit-setIfTrue" data-type="select" data-scene-name="' + keys[0] + '" data-state-index="' + keys[1] + '">' + select + '</select>';
                        } else {
                            text = '<input class="state-edit-setIfTrue" data-type="text" style="width: 100%" value="' + (that.data[node.key].setIfTrue === undefined ? '' : that.data[node.key].setIfTrue) + '" data-scene-name="' + keys[0] + '" data-state-index="' + keys[1] + '"/>';
                        }
                    } else {
                        text = '<input class="state-edit-setIfTrue" data-type="text" style="width: 100%" value="' + (that.data[node.key].setIfTrue === undefined ? '' : that.data[node.key].setIfTrue) + '" data-scene-name="' + keys[0] + '" data-state-index="' + keys[1] + '"/>';
                    }
                } else {
                    text = '<button class="state-set-true" data-scene-name="' + keys[0] + '" style="float: right"></button>';
                }
                } else {
                    if (keys[1] === undefined) {
                        text = '<input class="state-set-group" data-type="text" style="width: 100%" value="" data-scene-name="' + keys[0] + '"/>';
                    } else {
                        text = '';
                    }
                }
                $tdList.eq(6).html(text).css({'text-align': 'center', 'overflow': 'hidden', "white-space": "nowrap"});

                // - set value if false
                if (!that.main.objects[keys[0]].native.virtualGroup) {
                if (keys[1] !== undefined) {
                    if (that.main.objects[keys[0]].native.onFalse && that.main.objects[keys[0]].native.onFalse.enabled) {
                        var obj = that.main.objects[keys[0]];
                        var state = that.main.objects[obj.native.members[keys[1]].id];

                        if (state) {
                            if (state.common.type === 'boolean' || state.common.type === 'bool') {
                                text = '<input class="state-edit-setIfFalse" data-type="checkbox" type="checkbox" ' + (that.data[node.key].setIfFalse ? 'checked' : '') + ' data-scene-name="' + keys[0] + '" data-state-index="' + keys[1] + '"/>';
                            } else if (state.common.states && typeof state.common.states === 'object' && state.common.states.length) {
                                var select = '';
                                for (var s = 0; s < state.common.states.length; s++) {
                                    select += '<option value="' + s + '" ' + ((obj.native.members[keys[1]].setIfFalse == s) ? 'selected' : '') + '>' + state.common.states[s] + '</option>';
                                }
                                text = '<select class="state-edit-setIfFalse" data-type="select" data-scene-name="' + keys[0] + '" data-state-index="' + keys[1] + '">' + select + '</select>';
                            } else {
                                text = '<input class="state-edit-setIfFalse" data-type="text" style="width: 100%" value="' + (that.data[node.key].setIfFalse === undefined || that.data[node.key].setIfFalse === null ? '' : that.data[node.key].setIfFalse) + '" data-scene-name="' + keys[0] + '" data-state-index="' + keys[1] + '"/>';
                            }
                        } else {
                            text = '<input class="state-edit-setIfFalse" data-type="text" style="width: 100%" value="' + (that.data[node.key].setIfFalse === undefined || that.data[node.key].setIfFalse === null ? '' : that.data[node.key].setIfFalse) + '" data-scene-name="' + keys[0] + '" data-state-index="' + keys[1] + '"/>';
                        }
                    } else {
                        text = '';
                    }
                } else {
                    text = '<input class="scene-edit-setIfFalse" data-type="checkbox" type="checkbox" ' + ((that.main.objects[keys[0]].native.onFalse && that.main.objects[keys[0]].native.onFalse.enabled) ? 'checked' : '') + ' data-scene-name="' + keys[0] + '"/>';
                    if (that.main.objects[keys[0]].native.onFalse && that.main.objects[keys[0]].native.onFalse.enabled) {
                        text += '<button class="state-set-false" data-scene-name="' + keys[0] + '" style="float: right"></button>';
                    } else {
                        text += '<div style="width: 16px; float: right; height: 16px"></div>';
                    }
                }
                } else {
                    text = '';
                }
                $tdList.eq(7).html(text).css({'text-align': 'center', 'overflow': 'hidden', "white-space": "nowrap"});


                if (keys[1] !== undefined) {
                    text = '<input class="state-edit-delay" style="width: 100%" value="' + (that.data[node.key].delay || '') + '" data-scene-name="' + keys[0] + '" data-state-index="' + keys[1] + '"/>';
                } else {
                    text = '';
                }
                $tdList.eq(8).html(text).css({'text-align': 'center', 'overflow': 'hidden', "white-space": "nowrap"});
                $tdList.eq(9).html(that.data[node.key].buttons).css({'text-align': 'center'});

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
            dblclick: function(event, data) {
                console.log('dblclick');
                if (data && data.node && data.node.key) {
                    var keys = data.node.key.split('_$$$_');
                    if (keys[1] !== undefined) {
                        editState(keys[0], keys[1]);
                    } else {
                        data.node.toggleExpanded();
                    }
                }
            },
            collapse: function(event, data) {
                if (that.isCollapsed[data.node.key]) return;
                that.isCollapsed[data.node.key] = true;
                that.main.saveConfig('scenesIsCollapsed', JSON.stringify(that.isCollapsed));
            }
        });

        installColResize();

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
        that.$dialogReplace.dialog({
            autoOpen: false,
            modal:    true,
            width:    510,
            height:   215,
            buttons: [
                {
                    text: _('Ok'),
                    click: function () {
                        $(this).dialog('close');
                        var oldId = $('#dialog-replace-old-id').val();
                        var newId = $('#dialog-replace-new-id').val();
                        if (oldId === newId) {
                            console.warn('IDs re equal');
                            return;
                        }

                        that.main.confirmMessage(_('Are you sure to replace \"%s\" with \"%s\" in all scenes?', oldId, newId), _('Confirm'), 'help', function (isYes) {
                            if (isYes) {
                                replaceId(oldId, newId);
                            }
                        });
                    }
                },
                {
                    text: _('Cancel'),
                    click: function () {
                        $(this).dialog('close');
                    }
                }
            ]
        });

        that.$dialogState.dialog({
            autoOpen: false,
            modal:    true,
            width:    500,
            height:   350,
            buttons: [
                {
                    text: _('Ok'),
                    click: function () {
                        $(this).dialog('close');
                        var $dlgStateId = $('#dialog-state-id');
                        var scene = $dlgStateId.data('scene');
                        var index = $dlgStateId.data('index');
                        var type  = $dlgStateId.data('type');
                        var obj = that.main.objects[scene];
                        var valTrue = '';
                        if (type === 'check') {
                            valTrue = $('#dialog-state-setIfTrue-check').prop('checked');
                        } else if (type === 'select') {
                            valTrue = $('#dialog-state-setIfTrue-select').val();
                        } else {
                            valTrue = $('#dialog-state-setIfTrue-text').val();
                        }
                        if (typeof valTrue === 'string' && parseFloat(valTrue).toString() === valTrue) {
                            valTrue = parseFloat(valTrue);
                        } else if (valTrue === 'true') {
                            valTrue = true;
                        } if (valTrue === 'false') {
                            valTrue = false;
                        }
                        obj.native.members[index].setIfTrue = valTrue;

                        if (obj.native.onFalse && obj.native.onFalse.enabled) {
                            var valFalse = '';
                            if (type === 'check') {
                                valFalse = $('#dialog-state-setIfFalse-check').prop('checked');
                            } else if (type === 'select') {
                                valFalse = $('#dialog-state-setIfFalse-select').val();
                            } else {
                                valFalse = $('#dialog-state-setIfFalse-text').val();
                            }
                            if (typeof valFalse === 'string' && parseFloat(valFalse).toString() === valFalse) {
                                valFalse = parseFloat(valFalse);
                            } else if (valFalse === 'true') {
                                valFalse = true;
                            } if (valTrue === 'false') {
                                valFalse = false;
                            }
                            obj.native.members[index].setIfFalse = valFalse;
                        } else {
                            obj.native.members[index].setIfFalse = null;
                        }
                        obj.native.members[index].stopAllDelays = $('#dialog-state-stop-all-delays').prop('checked');
                        obj.native.members[index].disabled      = !$('#dialog-state-enabled').prop('checked');
                        obj.native.members[index].delay         = parseInt($('#dialog-state-delay').val(), 10) || 0;
                        obj.native.members[index].desc          = $('#dialog-state-description').val() || null;

                        that.main.socket.emit('setObject', scene, obj, function (err) {
                            if (err) that.main.showError(err);
                        });
                    }
                },
                {
                    text: _('Cancel'),
                    click: function () {
                        $(this).dialog('close');
                    }
                }
            ]
        });

        that.$dialogScene.dialog({
            autoOpen: false,
            modal:    true,
            width:    600,
            height:   610,
            buttons: [
                {
                    text: _('Ok'),
                    click: function () {
                        var scene = $('#dialog-scene-id').data('scene');
                        var obj = that.main.objects[scene];
                        var newId = null;
                        var newName = $('#dialog-scene-name').val();

                        if (obj.common.name !== newName) {
                            obj.common.name = newName;
                            newId = 'scene.' + obj.common.name.replace(/\s+/g, '_');
                            if (newId !== obj._id) {
                                if (that.list.indexOf(newId) !== -1) {
                                    that.main.showMessage(_('Name "%s" yet exists!', newId), _('Error'), 'alert');
                                }
                            } else {
                                newId = null;
                            }

                        }
                        $(this).dialog('close');

                        obj.common.enabled = $('#dialog-scene-enabled').prop('checked');
                        obj.common.desc    = $('#dialog-scene-description').val();
                        obj.common.engine  = $('#dialog-scene-engine').val();

                        if (!obj.native.onTrue)  obj.native.onTrue = {};
                        if (!obj.native.onFalse) obj.native.onFalse = {};

                        if (!obj.native.onTrue.trigger)  obj.native.onTrue.trigger  = {};
                        if (!obj.native.onFalse.trigger) obj.native.onFalse.trigger = {};

                        obj.native.burstIntervall  = parseInt($('#dialog-scene-interval').val(), 10) || 0;
                        obj.native.onFalse.enabled = $('#dialog-scene-use-false').prop('checked');
                        obj.native.onTrue.cron     = $('#dialog-scene-true-cron').val();
                        obj.native.onFalse.cron    = $('#dialog-scene-false-cron').val();
                        obj.native.virtualGroup    = $('#dialog-scene-virtual-group').prop('checked');

                        if ($('#dialog-scene-trigger-true').prop('checked')) {
                            obj.native.onTrue.trigger.id         = $('#dialog-scene-trigger-true-id').val();
                            obj.native.onTrue.trigger.condition  = $('#dialog-scene-trigger-true-cond').val();
                            obj.native.onTrue.trigger.value      = $('#dialog-scene-trigger-true-value').val();
                        } else {
                            obj.native.onTrue.trigger.id         = null;
                            obj.native.onTrue.trigger.condition  = null;
                            obj.native.onTrue.trigger.value      = null;
                        }

                        if ($('#dialog-scene-trigger-false').prop('checked') && obj.native.onFalse.enabled) {
                            obj.native.onFalse.trigger.id        = $('#dialog-scene-trigger-false-id').val();
                            obj.native.onFalse.trigger.condition = $('#dialog-scene-trigger-false-cond').val();
                            obj.native.onFalse.trigger.value     = $('#dialog-scene-trigger-false-value').val();
                        } else {
                            obj.native.onFalse.trigger.id        = null;
                            obj.native.onFalse.trigger.condition = null;
                            obj.native.onFalse.trigger.value     = null;
                        }
                        if (obj.native.virtualGroup) {
                            obj.native.onTrue.trigger.id         = null;
                            obj.native.onTrue.trigger.condition  = null;
                            obj.native.onTrue.trigger.value      = null;
                            obj.native.onFalse.trigger.id        = null;
                            obj.native.onFalse.trigger.condition = null;
                            obj.native.onFalse.trigger.value     = null;
                          }

                        if (newId) {
                            obj._id = newId;
                            that.main.socket.emit('delObject', scene, function (err) {
                                if (err) {
                                    that.main.showError(err);
                                } else {
                                    that.main.socket.emit('delState', scene, function (err) {
                                        that.main.socket.emit('setObject', newId, obj, function (err) {
                                            if (err) that.main.showError(err);
                                        });
                                    });
                                }
                            });
                        } else {
                            that.main.socket.emit('setObject', scene, obj, function (err) {
                                if (err) that.main.showError(err);
                            });
                        }
                    }
                },
                {
                    text: _('Cancel'),
                    click: function () {
                        $(this).dialog('close');
                    }
                }
            ]
        });

        $('#btn_replace_ids').button({icons: {primary: 'ui-icon ui-icon-transferthick-e-w'}, text: false}).css({width: 16, height: 16}).click(function () {
            that.$dialogReplace.dialog('open');
        });

        $('#dialog-scene-trigger-true').change(function () {
            if ($(this).prop('checked')) {
                $('#tr-dialog-scene-trigger-true-id').show();
                $('#tr-dialog-scene-trigger-true-cond').show();
                $('#tr-dialog-scene-trigger-true-value').show();
            } else {
                $('#tr-dialog-scene-trigger-true-id').hide();
                $('#tr-dialog-scene-trigger-true-cond').hide();
                $('#tr-dialog-scene-trigger-true-value').hide();
            }
        });

        $('#dialog-scene-trigger-false').change(function () {
            if ($(this).prop('checked') && $('#dialog-scene-use-false').prop('checked')) {
                $('#tr-dialog-scene-trigger-false-id').show();
                $('#tr-dialog-scene-trigger-false-cond').show();
                $('#tr-dialog-scene-trigger-false-value').show();
            } else {
                $('#tr-dialog-scene-trigger-false-id').hide();
                $('#tr-dialog-scene-trigger-false-cond').hide();
                $('#tr-dialog-scene-trigger-false-value').hide();
            }
        });

        $('#dialog-scene-use-false').change(function () {
            if ($(this).prop('checked')) {
                $('#tr-dialog-scene-trigger-false').show();
                $('#tr-dialog-scene-trigger-false-cron').show();
            } else {
                $('#tr-dialog-scene-trigger-false').hide();
                $('#tr-dialog-scene-trigger-false-cron').hide();
            }

            $('#dialog-scene-trigger-false').trigger('change');
        });

        $('#dialog-scene-virtual-group').change(function () {
            if ($(this).prop('checked')) {
                $('.scene-true').hide();
                $('.scene-false').hide();
            } else {
                $('.scene-true').show();
                $('.scene-false').show();
            }

            $('#dialog-scene-trigger-false').trigger('change');
        });

        $('.dialog-scene-id-selector').click(function () {
            var id = $(this).data('input');
            var val = $('#' + id).val();
            var sid = that.main.initSelectId();
            sid.selectId('show', val, function (newId) {
                $('#' + id).val(newId || '');
            });
        });
    };

    function getActualText(key) {
        var text = '';
        var keys = key.split('_$$$_');

        if (that.data[key].actual !== undefined && that.data[key].actual !== null) {
            if (keys[1] === undefined) {
                if (that.data[key].actual === 'true' || that.data[key].actual === true) {
                    text = '<span style="font-weight: bold; color: green">' + _('true') + '</span>';
                } else if (that.data[key].actual === 'false' || that.data[key].actual === false) {
                    text = '<span style="font-weight: bold; color: darkred">' + _('false') + '</span>';
                } else if (that.data[key].actual === 'uncertain') {
                    text = _('uncertain');
                } else {
                    text = that.data[key].actual.toString();
                }
            } else {
                if (that.data[key].actual === 'true' || that.data[key].actual === true) {
                    text = _('true');
                } else if (that.data[key].actual === 'false' || that.data[key].actual === false) {
                    text = _('false');
                } else {
                    text = that.data[key].actual.toString();
                }
            }
        }
        return text;
    }

    function getActualBackground(sceneId, state) {
        var obj = that.main.objects[sceneId];
        var stateObj = obj.native.members[state];
        if (stateObj.delay) return false;

        if (!that.main.states[stateObj.id]) {
            return (stateObj.setIfTrue  === undefined || stateObj.setIfTrue  === null || stateObj.setIfTrue  === '') ? 'lightgreen' : '';
        }

        if (stateObj.setIfTrue == that.main.states[stateObj.id].val) {
            return 'lightgreen';
        } else if (that.main.objects[sceneId].native.onFalse && that.main.objects[sceneId].native.onFalse.enabled && stateObj.setIfFalse == that.main.states[stateObj.id].val) {
            return 'lightpink ';
        } else {
            return '';
        }
    }

    function customFilter(node) {
        //if (node.parent && node.parent.match) return true;

        if (that.currentFilter) {
            if (!that.data[node.key]) return false;

            if ((that.data[node.key].name     && that.data[node.key].name.toLowerCase().indexOf(that.currentFilter) !== -1) ||
                (that.data[node.key].id       && that.data[node.key].id.toLowerCase().indexOf(that.currentFilter)   !== -1) ||
                (that.data[node.key].desc     && that.data[node.key].desc.toLowerCase().indexOf(that.currentFilter) !== -1)){
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
        while (this.list.indexOf('scene.0.' + _('scene') + '_' + i) !== -1) i++;
        var id = 'scene.0.scene' + i;

        var scene = {
            common: {
                name:       '0.' + _('scene') + ' ' + i,
                type:       'boolean',
                role:       'scene.state',
                desc:       _('scene') + ' ' + i,
                enabled:    true,
                read:       true,
                write:      true,
                def:        false,
                engine:     this.engines[0]
            },
            native: {
                onTrue: {
                    trigger: {

                    },
                    cron:    null,
                    astro:   null
                },
                onFalse: {
                    enabled: false,
                    trigger: {

                    },
                    cron:    null,
                    astro:   null
                },
                members:  []
            },
            type: 'state'
        };

        this.main.socket.emit('setObject', id, scene, function (err, res) {
            if (err) that.main.showError(err);
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
        $('#tab-scenes').show();

        if (typeof this.$grid !== 'undefined' && (!this.$grid[0]._isInited || update)) {
            this.$grid[0]._isInited = true;

            $('#process_running_scenes').show();

            this.$grid.find('tbody').html('');

            that.tree = [];
            that.data = {};
            this.list.sort();

            // list of the installed scenes
            for (var i = 0; i < this.list.length; i++) {
                var sceneId = this.list[i];
                var buttons = '<table class="no-space"><tr class="no-space">';
                buttons += '<td class="no-space"><button data-scene-name="' + sceneId + '" class="scene-edit-submit">'    + _('edit scene')   + '</button></td>';
                buttons += '<td class="no-space"><button data-scene-name="' + sceneId + '" class="scene-delete-submit">'  + _('delete scene') + '</button></td>';
                buttons += '<td class="no-space"><button data-scene-name="' + sceneId + '" class="scene-add-state">'      + _('add states')   + '</button></td>';
                buttons += '<td class="no-space"><button data-scene-name="' + sceneId + '" class="scene-copy-scene">'     + _('copy scene')   + '</button></td>';
                buttons += '</tr></table>';

                var cond = '';
                if (this.main.objects[sceneId].native.cron) {
                    cond = 'CRON: "' + this.main.objects[sceneId].native.cron + '"';
                }
                if (this.main.objects[sceneId].native.triggerTrueId) {
                    cond = _('Trigger:') + this.main.objects[sceneId].native.triggerTrueId + ' ' + this.main.objects[sceneId].native.triggerTrueCond + ' ' + this.main.objects[sceneId].native.triggerTrueValue;
                }

                var desc = this.main.objects[sceneId].common.desc || '';
                if (this.main.objects[sceneId].native && this.main.objects[sceneId].native.members && this.main.objects[sceneId].native.members.length) {
                    desc += ' [' + _('Items %s', this.main.objects[sceneId].native.members.length) + ']';
                }

                that.data[sceneId] = {
                    id:       sceneId,
                    name:     this.main.objects[sceneId].common.name || '',
                    desc:     desc,
                    enabled:  this.main.objects[sceneId].common.enabled,
                    cond:     cond,
                    setIfTrue:     '',
                    actual:   main.states[sceneId] ? main.states[sceneId].val : '',
                    buttons: buttons
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
                        buttons = '<table class="no-space"><tr class="no-space">';
                        buttons += '<td class="no-space"><button data-scene-name="' + sceneId + '" data-state-index="' + m + '" class="scene-state-edit-submit">'   + _('edit state')   + '</button></td>';
                        buttons += '<td class="no-space"><button data-scene-name="' + sceneId + '" data-state-index="' + m + '" class="scene-state-delete-submit">' + _('delete state') + '</button></td>';
                        if (m !== 0) {
                            buttons += '<td class="no-space"><button data-scene-name="' + sceneId + '" data-state-index="' + m + '" class="scene-state-up-submit">'   + _('move up')   + '</button></td>';
                        } else {
                            buttons += '<td class="no-space"><div style="width:24px"></div></td>';
                        }
                        if (m !== members.length - 1) {
                            buttons += '<td class="no-space"><button data-scene-name="' + sceneId + '" data-state-index="' + m + '" class="scene-state-down-submit">' + _('move down') + '</button></td>';
                        } else {
                            buttons += '<td class="no-space"><div style="width:24px"> </div></td>';
                        }
                        buttons += '</tr></table>';


                        that.data[sceneId + '_$$$_' + m] = {
                            id:         members[m].id,
                            name:       this.main.objects[members[m].id] ? (this.main.objects[members[m].id].common.name || '') : '',
                            desc:       members[m].desc ? members[m].desc : (this.main.objects[members[m].id] ? (this.main.objects[members[m].id].common.desc || '') : ''),
                            scene:      sceneId,
                            index:      m,
                            delay:      members[m].delay,
                            enabled:    !members[m].disabled,
                            setIfTrue:  members[m].setIfTrue,
                            setIfFalse: members[m].setIfFalse,
                            actual:     main.states[members[m].id] ? main.states[members[m].id].val : '',
                            buttons:    buttons
                        };
                        scene.children.push({
                            title:    members[m].id,
                            key:      sceneId + '_$$$_' + m
                        });
                    }
                }
            }

            that.$grid.fancytree('getTree').reload(that.tree);
            $('#grid-scenes').find('.fancytree-icon').each(function () {
                if ($(this).attr('src')) $(this).css({width: 22, height: 22});
            });
            $('#process_running_scenes').hide();
            if (that.currentFilter) that.$grid.fancytree('getTree').filterNodes(customFilter, false);

        }
    };

    function editState(scene, index) {
        var obj      = that.main.objects[scene];
        var stateObj = obj.native.members[index];
        var $dlgStateId = $('#dialog-state-id');
        $dlgStateId.html(stateObj.id);
        $dlgStateId.data('scene', scene);
        $dlgStateId.data('index', index);
        var state    = that.main.objects[stateObj.id];

        $('#tr-dialog-state-setIfTrue-select').hide();
        $('#tr-dialog-state-setIfTrue-check').hide();
        $('#tr-dialog-state-setIfTrue-text').hide();

        $('#tr-dialog-state-setIfFalse-select').hide();
        $('#tr-dialog-state-setIfFalse-check').hide();
        $('#tr-dialog-state-setIfFalse-text').hide();

        $('#dialog-state-stop-all-delays').prop('checked', stateObj.stopAllDelays);
        $('#dialog-state-description').val(stateObj.desc || '');

        if (state) {
            if (state.common.type === 'boolean' || state.common.type === 'bool') {
                $('#dialog-state-setIfTrue-check').prop('checked', stateObj.setIfTrue);
                $('#tr-dialog-state-setIfTrue-check').show();
                $dlgStateId.data('type', 'check');
            } else if (state.common.states && typeof state.common.states === 'object' && state.common.states.length) {
                var select = '';
                for (var s = 0; s < state.common.states.length; s++) {
                    select += '<option value="' + s + '" ' + ((stateObj.setIfTrue == s) ? 'selected' : '') + ' >' + state.common.states[s] + '</option>';
                }
                $('#dialog-state-setIfTrue-select').html(select);
                $('#tr-dialog-state-setIfTrue-select').show();
                $dlgStateId.data('type', 'select');
            } else {
                $('#tr-dialog-state-setIfTrue-text').show();
                $('#dialog-state-setIfTrue-text').val(stateObj.setIfTrue);
                $dlgStateId.data('type', 'text');
            }
        } else {
            $('#tr-dialog-state-setIfTrue-text').show();
            $('#dialog-state-setIfTrue-text').val(stateObj.setIfTrue);
            $dlgStateId.data('type', 'text');
        }

        if (obj.native.onFalse && obj.native.onFalse.enabled) {
            if (state) {
                if (state.common.type === 'boolean' || state.common.type === 'bool') {
                    $('#dialog-state-setIfFalse-check').prop('checked', stateObj.setIfFalse);
                    $('#tr-dialog-state-setIfFalse-check').show();
                } else if (state.common.states && typeof state.common.states === 'object' && state.common.states.length) {
                    var select = '';
                    for (var s = 0; s < state.common.states.length; s++) {
                        select += '<option value="' + s + '" ' + ((stateObj.setIfFalse == s) ? 'selected' : '') + ' >' + state.common.states[s] + '</option>';
                    }
                    $('#dialog-state-setIfFalse-select').html(select);
                    $('#tr-dialog-state-setIfFalse-select').show();
                } else {
                    $('#tr-dialog-state-setIfFalse-text').show();
                    $('#dialog-state-setIfFalse-text').val(stateObj.setIfFalse === null ? 0 : stateObj.setIfFalse);
                }
            } else {
                $('#tr-dialog-state-setIfFalse-text').show();
                $('#dialog-state-setIfFalse-text').val(stateObj.setIfFalse === null ? 0 : stateObj.setIfFalse);
            }
        } else {
            $('#tr-dialog-state-setIfFalse-text').val('');
            $('#tr-dialog-state-setIfFalse-check').prop('checked', false);
            $('#tr-dialog-state-setIfFalse-select').val('');
        }

        $('#dialog-state-actual').val(main.states[stateObj.id] ? main.states[stateObj.id].val : '');
        $('#dialog-state-delay').val(stateObj.delay || '');
        $('#dialog-state-enabled').prop('checked', !stateObj.disabled);
        that.$dialogState.dialog('open');
    }

    function editScene(scene) {
        var obj = that.main.objects[scene];
        $('#dialog-scene-id')
            .html(scene)
            .data('scene', scene);

        $('#dialog-scene-name').val(obj.common.name);
        $('#dialog-scene-description').val(obj.common.desc);
        $('#dialog-scene-true-cron').val(obj.native.onTrue ? obj.native.onTrue.cron : '');
        $('#dialog-scene-interval').val(obj.native.burstIntervall || '');

        if (obj.native.onTrue && obj.native.onTrue.trigger) {
            $('#dialog-scene-trigger-true-id').val(obj.native.onTrue.trigger.id);
            $('#dialog-scene-trigger-true-cond').val(obj.native.onTrue.trigger.condition);
            $('#dialog-scene-trigger-true-value').val(obj.native.onTrue.trigger.value);

            $('#dialog-scene-trigger-true').prop('checked', !!obj.native.onTrue.trigger.id).trigger('change');
        } else {
            $('#dialog-scene-trigger-true-id').val('');
            $('#dialog-scene-trigger-true-cond').val('==');
            $('#dialog-scene-trigger-true-value').val('');

            $('#dialog-scene-trigger-true').prop('checked', false).trigger('change');
        }

        if (obj.native.onFalse) {
            if (obj.native.onFalse.trigger) {
                $('#dialog-scene-trigger-false-id').val(obj.native.onFalse.trigger.id);
                $('#dialog-scene-trigger-false-cond').val(obj.native.onFalse.trigger.condition);
                $('#dialog-scene-trigger-false-value').val(obj.native.onFalse.trigger.value);

                $('#dialog-scene-trigger-false').prop('checked', !!obj.native.onFalse.trigger.id).trigger('change');
            } else {
                $('#dialog-scene-trigger-false-id').val('');
                $('#dialog-scene-trigger-false-cond').val('==');
                $('#dialog-scene-trigger-false-value').val('');

                $('#dialog-scene-trigger-false').prop('checked', false).trigger('change');
            }

            $('#dialog-scene-use-false').prop('checked', obj.native.onFalse.enabled).trigger('change');
            $('#dialog-scene-false-cron').val(obj.native.onFalse.cron);
        } else {
            $('#dialog-scene-use-false').prop('checked', false).trigger('change');
            $('#dialog-scene-false-cron').val('');
        }

        var engines = '';
        for (var e = 0; e < that.engines.length; e++) {
            engines += '<option ' + ((obj.common.engine === that.engines[e]) ? 'selected' : '') + ' value="' + that.engines[e] + '">' + that.engines[e].substring(15) + '</option>';
        }
        $('#dialog-scene-engine').html(engines);

        $('#dialog-scene-enabled').prop('checked', obj.common.enabled);
        $('#dialog-scene-virtual-group').prop('checked', !!obj.native.virtualGroup).trigger('change');

        that.$dialogScene.dialog('open');
    }

    function replaceIdInScene(scene, oldId, newId) {
        var obj = that.main.objects[scene];
        if (!obj || !obj.native) return;
        var isChanged = false;

        // Check triggerId
        if (obj.native.onTrue && obj.native.onTrue.trigger && obj.native.onTrue.trigger.id === oldId) {
            obj.native.onTrue.trigger.id = newId;
            isChanged = true;
        }
        if (obj.native.onFalse && obj.native.onFalse.trigger && obj.native.onFalse.trigger.id === oldId) {
            obj.native.onFalse.trigger.id = newId;
            isChanged = true;
        }

        var members = obj.native.members;
        if (members && members.length) {
            for (var m = 0; m < members.length; m++) {
                if (members[m].id === oldId) {
                    members[m].id = newId;
                    isChanged = true;
                }
            }
        }

        if (isChanged) {
            that.main.socket.emit('setObject', scene, obj, function (err) {
                if (err) that.main.showError(err);
            });
        }
        return isChanged;
    }

    function replaceId(oldId, newId) {
        var scenes = [];
        for (var i = 0; i < that.list.length; i++) {
            if (replaceIdInScene(that.list[i], oldId, newId)) {
                scenes.push(that.list[i]);
            }
        }
        if (scenes.length) {
            that.main.showMessage(_('IDs in following scenes were replaced: %s', scenes.join('<br>')), _('Result'));
        } else {
            that.main.showMessage(_('IDs was not found in any scene'), _('Result'));
        }
    }

    function setObject(scene, obj, callback) {
        if (that.timers[scene]) {
            that.timers[scene].callbacks.push(callback);
            clearTimeout(that.timers[scene].timer);
        } else {
            that.timers[scene] = {callbacks: [callback], timer: null, obj: JSON.parse(JSON.stringify(that.main.objects[scene]))};
        }
        // merge values
        if (obj.common) {
            that.timers[scene].obj.common.enabled = obj.common.enabled;
        } else {
            if (obj.native.onFalse) {
                if (obj.native.onFalse.enabled !== undefined) {
                    that.timers[scene].obj.native.onFalse = that.timers[scene].obj.native.onFalse || {};
                    that.timers[scene].obj.native.onFalse.enabled = obj.native.onFalse.enabled;
                }
            }
            if (obj.native.members) {
                for (var i = 0; i < obj.native.members.length; i++) {
                    if (obj.native.members[i]) {
                        $.extend(that.timers[scene].obj.native.members[i], obj.native.members[i]);
                    }
                }
            }
        }

        that.timers[scene].timer = setTimeout(function () {
            that.main.socket.emit('setObject', scene, that.timers[scene].obj, function (err) {
                for (var c = 0; c < that.timers[scene].callbacks.length; c++) {
                    that.timers[scene].callbacks[c](err);
                }
                delete that.timers[scene];
            });
        }, 500);
    }

    this.initButtons = function (scene, m) {
        $('.scene-add-state[data-scene-name="' + scene + '"]').button({
            text: false,
            icons: {
                primary: 'ui-icon-plusthick'
            }
        }).css('width', '22px').css('height', '18px').unbind('click').on('click', function () {
            var scene = $(this).attr('data-scene-name');
            var sid = that.main.initSelectIds();
            sid.selectId('show', null, function (newIds) {
                if (newIds && newIds.length) {
                    var obj = that.main.objects[scene];
                    for (var i = 0; i < newIds.length; i++) {
                        if (!obj.native.members) obj.native.members = [];

                        var desc = null;
                        if (that.main.states && that.main.states[newIds[i]] && that.main.states[newIds[i]].common) {
                            desc = that.main.states[newIds[i]].common.desc || null;
                        }

                        obj.native.members.push({
                            id:             newIds[i],
                            setIfTrue:      null,
                            setIfFalse:     null,
                            stopAllDelays:  true,
                            desc:           desc
                        });
                    }

                    that.main.socket.emit('setObject', scene, obj, function (err) {
                        if (err) that.main.showError(err);
                    });
                }
            });
        });

        $('.scene-copy-scene[data-scene-name="' + scene + '"]').button({
            text: false,
            icons: {
                primary: 'ui-icon-copy'
            }
        }).css('width', '22px').css('height', '18px').unbind('click').on('click', function () {
            var scene = $(this).attr('data-scene-name');
            var i = 1;
            scene = scene.replace(/_\d+$/, '');
            while (that.list.indexOf(scene + '_' + i) !== -1) i++;

            var obj = that.main.objects[scene];
            obj._id = scene + '_' + i;
            obj.common.name = obj.common.name.replace(/\s\d+$/, '') + ' ' + i;

            that.main.socket.emit('setObject', scene + '_' + i, obj, function (err) {
                if (err) that.main.showError(err);
            });
        });

        $('.scene-delete-submit[data-scene-name="' + scene + '"]').button({
            icons: {primary: 'ui-icon-trash'},
            text:  false
        }).css('width', '22px').css('height', '18px').unbind('click').on('click', function () {
            var scene = $(this).attr('data-scene-name');

            that.main.confirmMessage(_('Are you sure to delete %s?', scene), _('Confirm'), 'help', function (isYes) {
                if (isYes) {
                    that.main.socket.emit('delObject', scene, function (err) {
                        if (err) that.main.showError(err);
                    });
                }
            });
        });

        $('.scene-edit-submit[data-scene-name="' + scene + '"]').button({
            icons: {primary: 'ui-icon-note'},
            text: false
        }).css('width', '22px').css('height', '18px').unbind('click').on('click', function () {
            var scene = $(this).attr('data-scene-name');
            editScene(scene);
        });

        if (m !== undefined) {
            $('.state-edit-enabled[data-scene-name="' + scene + '"][data-state-index="' + m + '"]').change(function () {
                var scene = $(this).attr('data-scene-name');
                $(this).css({outline: '1px solid red'});
                var index = parseInt($(this).attr('data-state-index'), 10);

                var obj = {native: {members: []}};
                obj.native.members[index] = {};
                obj.native.members[index].disabled = !$(this).prop('checked');

                setObject(scene, obj, function (err) {
                    if (err) {
                        $(this).css({outline: ''}).prop('checked', !that.main.objects[scene].native.members[index].disabled);
                        that.main.showError(err);
                    }
                });
            });

            $('.state-edit-delay[data-scene-name="' + scene + '"][data-state-index="' + m + '"]').change(function () {
                var timer = $(this).data('timer');
                var $self = $(this).css({outline: '1px solid red'});

                if (timer) clearTimeout(timer);

                $(this).data('timer', setTimeout(function () {
                    var scene = $self.attr('data-scene-name');
                    var index = parseInt($self.attr('data-state-index'), 10);
                    var delay = $self.val();

                    var obj = {native: {members: []}};
                    obj.native.members[index] = {};
                    delay = parseInt(delay, 10) || 0;
                    if (!delay) delay = '';

                    obj.native.members[index].delay = delay;

                    setObject(scene, obj, function (err) {
                        if (err) {
                            $(this).css({outline: ''}).val(that.main.objects[scene].native.members[index].delay);
                            that.main.showError(err);
                        }
                    });
                }, 500));
            }).keydown(function () {
                $(this).trigger('change');
            });

            $('.state-edit-setIfTrue[data-scene-name="' + scene + '"][data-state-index="' + m + '"]').change(function () {
                var timer = $(this).data('timer');
                var $self = $(this).css({outline: '1px solid red'});
                if (timer) clearTimeout(timer);

                $(this).data('timer', setTimeout(function () {
                    var scene = $self.attr('data-scene-name');
                    var index = parseInt($self.attr('data-state-index'), 10);
                    var value;
                    if ($self.data('type') === 'checkbox') {
                        value = $self.prop('checked');
                    } else {
                        value = $self.val();
                        if (parseFloat(value).toString() === value) value = parseFloat(value);
                        if (value === 'true')  value = true;
                        if (value === 'false') value = false;
                    }

                    var obj = {native: {members: []}};
                    obj.native.members[index] = {};
                    obj.native.members[index].setIfTrue = value;
                    setObject(scene, obj, function (err) {
                        if (err) {
                            $(this).css({outline: ''}).val(that.main.objects[scene].native.members[index].setIfTrue);
                            that.main.showError(err);
                        }
                    });
                }, 500));
            }).keydown(function () {
                $(this).trigger('change');
            });

            $('.state-edit-setIfFalse[data-scene-name="' + scene + '"][data-state-index="' + m + '"]').change(function () {
                var timer = $(this).data('timer');
                var $self = $(this).css({outline: '1px solid red'});
                if (timer) clearTimeout(timer);

                $(this).data('timer', setTimeout(function () {
                    var scene = $self.attr('data-scene-name');
                    var index = parseInt($self.attr('data-state-index'), 10);
                    var value;
                    if ($self.data('type') === 'checkbox') {
                        value = $self.prop('checked');
                    } else {
                        value = $self.val();
                        if (parseFloat(value).toString() === value) value = parseFloat(value);
                        if (value === 'true')  value = true;
                        if (value === 'false') value = false;
                    }

                    var obj = {native: {members: []}};
                    obj.native.members[index] = {};
                    obj.native.members[index].setIfFalse = value;
                    setObject(scene, obj, function (err) {
                        if (err) {
                            $(this).css({outline: ''}).val(that.main.objects[scene].native.members[index].setIfFalse);
                            that.main.showError(err);
                        }
                    });
                }, 500));
            }).keydown(function () {
                $(this).trigger('change');
            });

            $('.scene-state-edit-submit[data-scene-name="' + scene + '"][data-state-index="' + m + '"]').button({
                icons: {primary: 'ui-icon-note'},
                text:  false
            }).css('width', '22px').css('height', '18px').unbind('click').on('click', function () {
                var scene = $(this).attr('data-scene-name');
                var index = parseInt($(this).attr('data-state-index'), 10);

                editState(scene, index);
            });

            $('.scene-state-delete-submit[data-scene-name="' + scene + '"][data-state-index="' + m + '"]').button({
                icons: {primary: 'ui-icon-trash'},
                text:  false
            }).css('width', '22px').css('height', '18px').unbind('click').on('click', function () {
                var scene = $(this).attr('data-scene-name');
                var index = parseInt($(this).attr('data-state-index'), 10);
                var obj = that.main.objects[scene];

                that.main.confirmMessage(_('Are you sure to delete %s from %s?', obj.native.members[index].id, scene), _('Confirm'), 'help', function (isYes) {
                    if (isYes) {
                        obj.native.members.splice(index, 1);

                        that.main.socket.emit('setObject', scene, obj, function (err) {
                            if (err) that.main.showError(err);
                        });
                    }
                });
            });
            $('.scene-state-up-submit[data-scene-name="' + scene + '"][data-state-index="' + m + '"]').button({
                icons: {primary: 'ui-icon-circle-arrow-n'},
                text:  false
            }).css('width', '22px').css('height', '18px').unbind('click').on('click', function () {
                var scene = $(this).attr('data-scene-name');
                var index = parseInt($(this).attr('data-state-index'), 10);
                var obj = that.main.objects[scene];
                var m = obj.native.members[index - 1];
                obj.native.members[index - 1] = obj.native.members[index];
                obj.native.members[index] = m;

                that.main.socket.emit('setObject', scene, obj, function (err) {
                    if (err) that.main.showError(err);
                });
            });
            $('.scene-state-down-submit[data-scene-name="' + scene + '"][data-state-index="' + m + '"]').button({
                icons: {primary: 'ui-icon-circle-arrow-s'},
                text:  false
            }).css('width', '22px').css('height', '18px').unbind('click').on('click', function () {
                var scene = $(this).attr('data-scene-name');
                var index = parseInt($(this).attr('data-state-index'), 10);
                var obj = that.main.objects[scene];
                var m = obj.native.members[index + 1];
                obj.native.members[index + 1] = obj.native.members[index];
                obj.native.members[index] = m;

                that.main.socket.emit('setObject', scene, obj, function (err) {
                    if (err) that.main.showError(err);
                });
            });
        } else {
            $('.scene-edit-enabled[data-scene-name="' + scene + '"]').change(function () {
                var scene = $(this).attr('data-scene-name');
                $(this).css({outline: '1px solid red'});
                var obj = {common: {}};
                obj.common.enabled = $(this).prop('checked');
                setObject(scene, obj, function (err) {
                    if (err) {
                        $(this).css({outline: ''}).prop('checked', that.main.objects[scene].common.enabled);
                        that.main.showError(err);
                    }
                });
            });
            $('.scene-edit-setIfFalse[data-scene-name="' + scene + '"]').change(function () {
                var scene = $(this).attr('data-scene-name');
                $(this).css({outline: '1px solid red'});
                var obj = {native: {onFalse:{}}};
                obj.native.onFalse.enabled = $(this).prop('checked');
                setObject(scene, obj, function (err) {
                    if (err) {
                        $(this).css({outline: ''}).prop('checked', that.main.objects[scene].native.onFalse && that.main.objects[scene].native.onFalse.enabled);
                        that.main.showError(err);
                    }
                });
            });
            $('.state-set-true[data-scene-name="' + scene + '"]').button({
                icons: {primary: 'ui-icon-play'},
                text: false
            }).css('width', '16px').css('height', '16px').click(function () {
                var scene = $(this).attr('data-scene-name');
                that.main.socket.emit('setState', scene, true, function (err) {
                    if (err) that.main.showError(err);
                });
            }).attr('title', _('Test scene with true'));

            $('.state-set-group[data-scene-name="' + scene + '"]').change(function () {
                var scene = $(this).attr('data-scene-name');
                var val = $(this).val();
                if (val === 'true') val = true;
                if (val === 'false') val = false;
                if (parseFloat(val).toString() == val) val = parseFloat(val);

                that.main.socket.emit('setState', scene, val, function (err) {
                    if (err) that.main.showError(err);
                });
            }).attr('title', _('Test scene with true'));

            $('.state-set-false[data-scene-name="' + scene + '"]').button({
                icons: {primary: 'ui-icon-play'},
                text: false
            }).css('width', '16px').css('height', '16px').click(function () {
                var scene = $(this).attr('data-scene-name');
                that.main.socket.emit('setState', scene, false, function (err) {
                    if (err) that.main.showError(err);
                });
            }).attr('title', _('Test scene with false'));
        }
    };

    this.objectChange = function (id, obj) {
        // update engines
        if (id.match(/^system\.adapter\.scenes\.\d+$/)) {
            if (obj) {
                if (this.engines.indexOf(id) === -1) {
                    this.engines.push(id);
                    if (typeof this.$grid !== 'undefined' && this.$grid[0]._isInited) {
                        this.init(true);
                    }
                    return;
                }
            } else {
                var pos = this.engines.indexOf(id);
                if (pos != -1) {
                    this.engines.splice(pos, 1);
                    if (typeof this.$grid !== 'undefined' && this.$grid[0]._isInited) {
                        this.init(true);
                    }
                    return;
                }
            }
        }

        // Update Scene Table
        if (id.match(/^scene\..+$/)) {
            if (obj) {
                if (this.list.indexOf(id) === -1) this.list.push(id);
            } else {
                var j = this.list.indexOf(id);
                if (j !== -1) this.list.splice(j, 1);
            }

            if (typeof this.$grid !== 'undefined' && this.$grid[0]._isInited) {
                this.init(true);
            }
        }
    };

    this.stateChange = function (id, state) {
        if (id.match(/^scene\./)) {
            $('.scene-value[data-state="' +id + '"').each(function () {
                var scene = $(this).attr('data-scene-name');
                var index = parseInt($(this).attr('data-state-index'), 10);
                that.data[scene].actual = state ? state.val : null;
                $(this).html(getActualText(scene));
            });
        }
        $('.state-value[data-state="' +id + '"').each(function () {
            var scene = $(this).attr('data-scene-name');
            var index = parseInt($(this).attr('data-state-index'), 10);
            var key = scene + '_$$$_' + index;
            that.data[key].actual = state ? state.val : null;

            $(this).html(getActualText(key));
            
            if (!that.data[key].delay) {
                var background = getActualBackground(scene, index);
                if (background === 'lightgreen') {
                    $(this).parent().css('background', 'lightgreen').attr('title', _('is equal'));
                } else if (background === 'lightpink ') {
                    $(this).parent().css('background', 'lightpink ').attr('title', _('is equal with false'));
                } else {
                    $(this).parent().css('background', '').attr('title', _('non equal'));
                }
            } else {
                $(this).parent().css('background', '').attr('title', _('width delay'));
            }
        });
    };
}

var main = {
    socket:         io.connect(),
    saveConfig:     function (attr, value) {
        if (!main.config) return;
        if (attr) main.config[attr] = value;

        if (typeof storage !== 'undefined') {
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
            $('#dialog-message-icon')
                .show()
                .attr('class', '')
                .addClass('ui-icon ui-icon-' + icon);
        } else {
            $('#dialog-message-icon').hide();
        }
        $dialogMessage.dialog('open');
    },
    confirmMessage: function (message, title, icon, callback) {
        $dialogConfirm.dialog('option', 'title', title || _('Message'));
        $('#dialog-confirm-text').html(message);
        if (icon) {
            $('#dialog-confirm-icon')
                .show()
                .attr('class', '')
                .addClass('ui-icon ui-icon-' + icon);
        } else {
            $('#dialog-confirm-icon').hide();
        }
        $dialogConfirm.data('callback', callback);
        $dialogConfirm.dialog('open');
    },
    initSelectIds:   function () {
        if (main.selectIds) return main.selectIds;
        main.selectIds = $('#dialog-select-members').selectId('init',  {
            objects:       main.objects,
            states:        main.states,
            noMultiselect: false,
            imgPath:       '../../lib/css/fancytree/',
            filter:        {type: 'state'},
            name:          'scenes-add-states',
            texts: {
                select:          _('Select'),
                cancel:          _('Cancel'),
                all:             _('All'),
                id:              _('ID'),
                name:            _('Name'),
                role:            _('Role'),
                room:            _('Room'),
                value:           _('Value'),
                selectid:        _('Select ID'),
                from:            _('From'),
                lc:              _('Last changed'),
                ts:              _('Time stamp'),
                wait:            _('Processing...'),
                ack:             _('Acknowledged'),
                selectAll:       _('Select all'),
                unselectAll:     _('Deselect all'),
                invertSelection: _('Invert selection')
            },
            columns: ['image', 'name', 'role', 'room', 'value']
        });
        return main.selectIds;
    },
    initSelectId:   function () {
        if (main.selectId) return main.selectId;
        main.selectId = $('#dialog-select-member').selectId('init',  {
            objects:       main.objects,
            states:        main.states,
            noMultiselect: true,
            imgPath:       '../../lib/css/fancytree/',
            filter:        {type: 'state'},
            name:          'scenes-select-state',
            texts: {
                select:          _('Select'),
                cancel:          _('Cancel'),
                all:             _('All'),
                id:              _('ID'),
                name:            _('Name'),
                role:            _('Role'),
                room:            _('Room'),
                value:           _('Value'),
                selectid:        _('Select ID'),
                from:            _('From'),
                lc:              _('Last changed'),
                ts:              _('Time stamp'),
                wait:            _('Processing...'),
                ack:             _('Acknowledged'),
                selectAll:       _('Select all'),
                unselectAll:     _('Deselect all'),
                invertSelection: _('Invert selection')
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
    selectId:       null,
    selectIds:      null
};

var $dialogMessage =        $('#dialog-message');
var $dialogConfirm =        $('#dialog-confirm');

// Read all positions, selected widgets for every view,
// Selected view, selected menu page,
// Selected widget or view page
// Selected filter
if (typeof storage !== 'undefined') {
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
                if (!main.objects.hasOwnProperty(id)) continue;
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
        if (isNew || JSON.stringify(main.objects[id]) !== JSON.stringify(obj)) {
            main.objects[id] = obj;
            changed = true;
        }
    } else if (main.objects[id]) {
        changed = true;
        oldObj = {_id: id, type: main.objects[id].type};
        delete main.objects[id];
    }

    if (main.selectId)  main.selectId.selectId('object', id, obj);
    if (main.selectIds) main.selectIds.selectId('object', id, obj);

    scenes.objectChange(id, obj);
}

function stateChange(id, state) {
    id = id ? id.replace(/ /g, '_') : '';

    if (!id || !id.match(/\.messagebox$/)) {
        if (main.selectId)  main.selectId.selectId('state', id, state);
        if (main.selectIds) main.selectIds.selectId('state', id, state);

        if (!state) {
            delete main.states[id];
        } else {
            main.states[id] = state;
        }

        scenes.stateChange(id, state);
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