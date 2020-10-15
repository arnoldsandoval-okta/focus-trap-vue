/*!
  * focus-trap-vue v1.0.0
  * (c) 2020 Eduardo San Martin Morote
  * @license MIT
  */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var focusTrap = require('focus-trap');

// import Component from 'vue-class-component'
// @ts-ignore
var FocusTrap = {
    // @ts-ignore
    props: {
        active: {
            // TODO: could be options for activate
            type: Boolean,
            default: true,
        },
        escapeDeactivates: {
            type: Boolean,
            default: true,
        },
        returnFocusOnDeactivate: {
            type: Boolean,
            default: true,
        },
        allowOutsideClick: {
            type: Boolean,
            default: true,
        },
        clickOutsideDeactivates: {
            type: Boolean,
            default: false,
        },
        initialFocus: [String, Function],
        fallbackFocus: [String, Function],
    },
    model: {
        event: 'update:active',
        prop: 'active',
    },
    mounted: function () {
        var _this = this;
        this.$watch('active', function (active) {
            if (active) {
                // has no effect if already activated
                _this.trap = focusTrap.createFocusTrap(
                // @ts-ignore
                _this.$el, {
                    escapeDeactivates: _this.escapeDeactivates,
                    allowOutsideClick: function () { return _this.allowOutsideClick; },
                    clickOutsideDeactivates: _this.clickOutsideDeactivates,
                    returnFocusOnDeactivate: _this.returnFocusOnDeactivate,
                    onActivate: function () {
                        _this.$emit('update:active', true);
                        _this.$emit('activate');
                    },
                    onDeactivate: function () {
                        _this.$emit('update:active', false);
                        _this.$emit('deactivate');
                    },
                    initialFocus: _this.initialFocus || (function () { return _this.$el; }),
                    fallbackFocus: _this.fallbackFocus,
                });
                _this.trap.activate();
            }
            else {
                _this.trap && _this.trap.deactivate();
            }
        }, { immediate: true });
    },
    beforeDestroy: function () {
        this.trap && this.trap.deactivate();
        // @ts-ignore
        this.trap = null;
    },
    methods: {
        activate: function () {
            // @ts-ignore
            this.trap.activate();
        },
        deactivate: function () {
            // @ts-ignore
            this.trap.deactivate();
        },
    },
    render: function () {
        var content = this.$slots.default;
        if (!content || !content.length || content.length > 1)
            throw new Error('FocusTrap requires exactly one child');
        return content[0];
    },
};

exports.FocusTrap = FocusTrap;
