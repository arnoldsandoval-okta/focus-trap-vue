import Vue, { ComponentOptions } from 'vue';
import { FocusTrap as FocusTrapI } from 'focus-trap';
interface FocusTrapComponentProps {
    active: boolean;
    escapeDeactivates: boolean;
    returnFocusOnDeactivate: boolean;
    allowOutsideClick: boolean;
    clickOutsideDeactivates: boolean;
    initialFocus: string | (() => any);
    fallbackFocus: string | (() => any);
}
interface FocusTrapComponentsMethods {
}
interface FocusTrapComponent extends Vue, ComponentOptions<never, {}, FocusTrapComponentsMethods, {}, {}> {
    trap: FocusTrapI;
    active: FocusTrapComponentProps['active'];
    escapeDeactivates: FocusTrapComponentProps['escapeDeactivates'];
    returnFocusOnDeactivate: FocusTrapComponentProps['returnFocusOnDeactivate'];
    allowOutsideClick: FocusTrapComponentProps['allowOutsideClick'];
    clickOutsideDeactivates: FocusTrapComponentProps['clickOutsideDeactivates'];
    initialFocus: FocusTrapComponentProps['initialFocus'];
    fallbackFocus: FocusTrapComponentProps['fallbackFocus'];
}
declare const FocusTrap: FocusTrapComponent;
export default FocusTrap;
