/*!
  * focus-trap-vue v1.0.0
  * (c) 2020 Eduardo San Martin Morote
  * @license MIT
  */
import { createFocusTrap } from 'focus-trap';

// import Component from 'vue-class-component'
// @ts-ignore
const FocusTrap = {
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
    mounted() {
        this.$watch('active', (active) => {
            if (active) {
                // has no effect if already activated
                this.trap = createFocusTrap(
                // @ts-ignore
                this.$el, {
                    escapeDeactivates: this.escapeDeactivates,
                    allowOutsideClick: () => this.allowOutsideClick,
                    clickOutsideDeactivates: this.clickOutsideDeactivates,
                    returnFocusOnDeactivate: this.returnFocusOnDeactivate,
                    onActivate: () => {
                        this.$emit('update:active', true);
                        this.$emit('activate');
                    },
                    onDeactivate: () => {
                        this.$emit('update:active', false);
                        this.$emit('deactivate');
                    },
                    initialFocus: this.initialFocus || (() => this.$el),
                    fallbackFocus: this.fallbackFocus,
                });
                this.trap.activate();
            }
            else {
                this.trap && this.trap.deactivate();
            }
        }, { immediate: true });
    },
    beforeDestroy() {
        this.trap && this.trap.deactivate();
        // @ts-ignore
        this.trap = null;
    },
    methods: {
        activate() {
            // @ts-ignore
            this.trap.activate();
        },
        deactivate() {
            // @ts-ignore
            this.trap.deactivate();
        },
    },
    render() {
        const content = this.$slots.default;
        if (!content || !content.length || content.length > 1)
            throw new Error('FocusTrap requires exactly one child');
        return content[0];
    },
};

export { FocusTrap };
