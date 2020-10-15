/*!
  * focus-trap-vue v1.0.0
  * (c) 2020 Eduardo San Martin Morote
  * @license MIT
  */
var FocusTrapVue = (function (exports) {
  'use strict';

  /*!
  * tabbable 5.1.0
  * @license MIT, https://github.com/focus-trap/tabbable/blob/master/LICENSE
  */
  let candidateSelectors = [
    'input',
    'select',
    'textarea',
    'a[href]',
    'button',
    '[tabindex]',
    'audio[controls]',
    'video[controls]',
    '[contenteditable]:not([contenteditable="false"])',
    'details>summary',
  ];
  let candidateSelector = /* #__PURE__ */ candidateSelectors.join(',');

  let matches =
    typeof Element === 'undefined'
      ? function () {}
      : Element.prototype.matches ||
        Element.prototype.msMatchesSelector ||
        Element.prototype.webkitMatchesSelector;

  function tabbable(el, options) {
    options = options || {};

    let regularTabbables = [];
    let orderedTabbables = [];

    let candidates = getCandidates(
      el,
      options.includeContainer,
      isNodeMatchingSelectorTabbable
    );

    candidates.forEach(function (candidate, i) {
      let candidateTabindex = getTabindex(candidate);
      if (candidateTabindex === 0) {
        regularTabbables.push(candidate);
      } else {
        orderedTabbables.push({
          documentOrder: i,
          tabIndex: candidateTabindex,
          node: candidate,
        });
      }
    });

    let tabbableNodes = orderedTabbables
      .sort(sortOrderedTabbables)
      .map((a) => a.node)
      .concat(regularTabbables);

    return tabbableNodes;
  }

  function getCandidates(el, includeContainer, filter) {
    let candidates = Array.prototype.slice.apply(
      el.querySelectorAll(candidateSelector)
    );
    if (includeContainer && matches.call(el, candidateSelector)) {
      candidates.unshift(el);
    }
    candidates = candidates.filter(filter);
    return candidates;
  }

  function isNodeMatchingSelectorTabbable(node) {
    if (
      !isNodeMatchingSelectorFocusable(node) ||
      isNonTabbableRadio(node) ||
      getTabindex(node) < 0
    ) {
      return false;
    }
    return true;
  }

  function isNodeMatchingSelectorFocusable(node) {
    if (node.disabled || isHiddenInput(node) || isHidden(node)) {
      return false;
    }
    return true;
  }

  let focusableCandidateSelector = /* #__PURE__ */ candidateSelectors
    .concat('iframe')
    .join(',');
  function isFocusable(node) {
    if (!node) {
      throw new Error('No node provided');
    }
    if (matches.call(node, focusableCandidateSelector) === false) {
      return false;
    }
    return isNodeMatchingSelectorFocusable(node);
  }

  function getTabindex(node) {
    let tabindexAttr = parseInt(node.getAttribute('tabindex'), 10);

    if (!isNaN(tabindexAttr)) {
      return tabindexAttr;
    }

    // Browsers do not return `tabIndex` correctly for contentEditable nodes;
    // so if they don't have a tabindex attribute specifically set, assume it's 0.
    if (isContentEditable(node)) {
      return 0;
    }

    // in Chrome, <audio controls/> and <video controls/> elements get a default
    //  `tabIndex` of -1 when the 'tabindex' attribute isn't specified in the DOM,
    //  yet they are still part of the regular tab order; in FF, they get a default
    //  `tabIndex` of 0; since Chrome still puts those elements in the regular tab
    //  order, consider their tab index to be 0
    if (
      (node.nodeName === 'AUDIO' || node.nodeName === 'VIDEO') &&
      node.getAttribute('tabindex') === null
    ) {
      return 0;
    }

    return node.tabIndex;
  }

  function sortOrderedTabbables(a, b) {
    return a.tabIndex === b.tabIndex
      ? a.documentOrder - b.documentOrder
      : a.tabIndex - b.tabIndex;
  }

  function isContentEditable(node) {
    return node.contentEditable === 'true';
  }

  function isInput(node) {
    return node.tagName === 'INPUT';
  }

  function isHiddenInput(node) {
    return isInput(node) && node.type === 'hidden';
  }

  function isRadio(node) {
    return isInput(node) && node.type === 'radio';
  }

  function isNonTabbableRadio(node) {
    return isRadio(node) && !isTabbableRadio(node);
  }

  function getCheckedRadio(nodes, form) {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].checked && nodes[i].form === form) {
        return nodes[i];
      }
    }
  }

  function isTabbableRadio(node) {
    if (!node.name) {
      return true;
    }
    const radioScope = node.form || node.ownerDocument;
    let radioSet = radioScope.querySelectorAll(
      'input[type="radio"][name="' + node.name + '"]'
    );
    let checked = getCheckedRadio(radioSet, node.form);
    return !checked || checked === node;
  }

  function isHidden(node) {
    if (getComputedStyle(node).visibility === 'hidden') return true;

    while (node) {
      if (getComputedStyle(node).display === 'none') return true;
      node = node.parentElement;
    }

    return false;
  }

  /*!
  * focus-trap 6.1.0
  * @license MIT, https://github.com/focus-trap/focus-trap/blob/master/LICENSE
  */

  var activeFocusDelay;

  var activeFocusTraps = (function () {
    var trapQueue = [];
    return {
      activateTrap: function (trap) {
        if (trapQueue.length > 0) {
          var activeTrap = trapQueue[trapQueue.length - 1];
          if (activeTrap !== trap) {
            activeTrap.pause();
          }
        }

        var trapIndex = trapQueue.indexOf(trap);
        if (trapIndex === -1) {
          trapQueue.push(trap);
        } else {
          // move this existing trap to the front of the queue
          trapQueue.splice(trapIndex, 1);
          trapQueue.push(trap);
        }
      },

      deactivateTrap: function (trap) {
        var trapIndex = trapQueue.indexOf(trap);
        if (trapIndex !== -1) {
          trapQueue.splice(trapIndex, 1);
        }

        if (trapQueue.length > 0) {
          trapQueue[trapQueue.length - 1].unpause();
        }
      },
    };
  })();

  function createFocusTrap(element, userOptions) {
    var doc = document;
    var container =
      typeof element === 'string' ? doc.querySelector(element) : element;

    var config = {
      returnFocusOnDeactivate: true,
      escapeDeactivates: true,
      delayInitialFocus: true,
      ...userOptions,
    };

    var state = {
      firstTabbableNode: null,
      lastTabbableNode: null,
      nodeFocusedBeforeActivation: null,
      mostRecentlyFocusedNode: null,
      active: false,
      paused: false,
    };

    var trap = {
      activate: activate,
      deactivate: deactivate,
      pause: pause,
      unpause: unpause,
    };

    return trap;

    function activate(activateOptions) {
      if (state.active) return;

      updateTabbableNodes();

      state.active = true;
      state.paused = false;
      state.nodeFocusedBeforeActivation = doc.activeElement;

      var onActivate =
        activateOptions && activateOptions.onActivate
          ? activateOptions.onActivate
          : config.onActivate;
      if (onActivate) {
        onActivate();
      }

      addListeners();
      return trap;
    }

    function deactivate(deactivateOptions) {
      if (!state.active) return;

      clearTimeout(activeFocusDelay);

      removeListeners();
      state.active = false;
      state.paused = false;

      activeFocusTraps.deactivateTrap(trap);

      var onDeactivate =
        deactivateOptions && deactivateOptions.onDeactivate !== undefined
          ? deactivateOptions.onDeactivate
          : config.onDeactivate;
      if (onDeactivate) {
        onDeactivate();
      }

      var returnFocus =
        deactivateOptions && deactivateOptions.returnFocus !== undefined
          ? deactivateOptions.returnFocus
          : config.returnFocusOnDeactivate;
      if (returnFocus) {
        delay(function () {
          tryFocus(getReturnFocusNode(state.nodeFocusedBeforeActivation));
        });
      }

      return trap;
    }

    function pause() {
      if (state.paused || !state.active) return;
      state.paused = true;
      removeListeners();
    }

    function unpause() {
      if (!state.paused || !state.active) return;
      state.paused = false;
      updateTabbableNodes();
      addListeners();
    }

    function addListeners() {
      if (!state.active) return;

      // There can be only one listening focus trap at a time
      activeFocusTraps.activateTrap(trap);

      // Delay ensures that the focused element doesn't capture the event
      // that caused the focus trap activation.
      activeFocusDelay = config.delayInitialFocus
        ? delay(function () {
            tryFocus(getInitialFocusNode());
          })
        : tryFocus(getInitialFocusNode());

      doc.addEventListener('focusin', checkFocusIn, true);
      doc.addEventListener('mousedown', checkPointerDown, {
        capture: true,
        passive: false,
      });
      doc.addEventListener('touchstart', checkPointerDown, {
        capture: true,
        passive: false,
      });
      doc.addEventListener('click', checkClick, {
        capture: true,
        passive: false,
      });
      doc.addEventListener('keydown', checkKey, {
        capture: true,
        passive: false,
      });

      return trap;
    }

    function removeListeners() {
      if (!state.active) return;

      doc.removeEventListener('focusin', checkFocusIn, true);
      doc.removeEventListener('mousedown', checkPointerDown, true);
      doc.removeEventListener('touchstart', checkPointerDown, true);
      doc.removeEventListener('click', checkClick, true);
      doc.removeEventListener('keydown', checkKey, true);

      return trap;
    }

    function getNodeForOption(optionName) {
      var optionValue = config[optionName];
      var node = optionValue;
      if (!optionValue) {
        return null;
      }
      if (typeof optionValue === 'string') {
        node = doc.querySelector(optionValue);
        if (!node) {
          throw new Error('`' + optionName + '` refers to no known node');
        }
      }
      if (typeof optionValue === 'function') {
        node = optionValue();
        if (!node) {
          throw new Error('`' + optionName + '` did not return a node');
        }
      }
      return node;
    }

    function getInitialFocusNode() {
      var node;
      if (getNodeForOption('initialFocus') !== null) {
        node = getNodeForOption('initialFocus');
      } else if (container.contains(doc.activeElement)) {
        node = doc.activeElement;
      } else {
        node = state.firstTabbableNode || getNodeForOption('fallbackFocus');
      }

      if (!node) {
        throw new Error(
          'Your focus-trap needs to have at least one focusable element'
        );
      }

      return node;
    }

    function getReturnFocusNode(previousActiveElement) {
      var node = getNodeForOption('setReturnFocus');
      return node ? node : previousActiveElement;
    }

    // This needs to be done on mousedown and touchstart instead of click
    // so that it precedes the focus event.
    function checkPointerDown(e) {
      if (container.contains(e.target)) return;
      if (config.clickOutsideDeactivates) {
        deactivate({
          returnFocus: !isFocusable(e.target),
        });
        return;
      }
      // This is needed for mobile devices.
      // (If we'll only let `click` events through,
      // then on mobile they will be blocked anyways if `touchstart` is blocked.)
      if (
        config.allowOutsideClick &&
        (typeof config.allowOutsideClick === 'boolean'
          ? config.allowOutsideClick
          : config.allowOutsideClick(e))
      ) {
        return;
      }
      e.preventDefault();
    }

    // In case focus escapes the trap for some strange reason, pull it back in.
    function checkFocusIn(e) {
      // In Firefox when you Tab out of an iframe the Document is briefly focused.
      if (container.contains(e.target) || e.target instanceof Document) {
        return;
      }
      e.stopImmediatePropagation();
      tryFocus(state.mostRecentlyFocusedNode || getInitialFocusNode());
    }

    function checkKey(e) {
      if (config.escapeDeactivates !== false && isEscapeEvent(e)) {
        e.preventDefault();
        deactivate();
        return;
      }
      if (isTabEvent(e)) {
        checkTab(e);
        return;
      }
    }

    // Hijack Tab events on the first and last focusable nodes of the trap,
    // in order to prevent focus from escaping. If it escapes for even a
    // moment it can end up scrolling the page and causing confusion so we
    // kind of need to capture the action at the keydown phase.
    function checkTab(e) {
      updateTabbableNodes();
      if (e.shiftKey && e.target === state.firstTabbableNode) {
        e.preventDefault();
        tryFocus(state.lastTabbableNode);
        return;
      }
      if (!e.shiftKey && e.target === state.lastTabbableNode) {
        e.preventDefault();
        tryFocus(state.firstTabbableNode);
        return;
      }
    }

    function checkClick(e) {
      if (config.clickOutsideDeactivates) return;
      if (container.contains(e.target)) return;
      if (
        config.allowOutsideClick &&
        (typeof config.allowOutsideClick === 'boolean'
          ? config.allowOutsideClick
          : config.allowOutsideClick(e))
      ) {
        return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();
    }

    function updateTabbableNodes() {
      var tabbableNodes = tabbable(container);
      state.firstTabbableNode = tabbableNodes[0] || getInitialFocusNode();
      state.lastTabbableNode =
        tabbableNodes[tabbableNodes.length - 1] || getInitialFocusNode();
    }

    function tryFocus(node) {
      if (node === doc.activeElement) return;
      if (!node || !node.focus) {
        tryFocus(getInitialFocusNode());
        return;
      }
      node.focus({ preventScroll: !!config.preventScroll });
      state.mostRecentlyFocusedNode = node;
      if (isSelectableInput(node)) {
        node.select();
      }
    }
  }

  function isSelectableInput(node) {
    return (
      node.tagName &&
      node.tagName.toLowerCase() === 'input' &&
      typeof node.select === 'function'
    );
  }

  function isEscapeEvent(e) {
    return e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27;
  }

  function isTabEvent(e) {
    return e.key === 'Tab' || e.keyCode === 9;
  }

  function delay(fn) {
    return setTimeout(fn, 0);
  }

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
                  _this.trap = createFocusTrap(
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

  return exports;

}({}));
