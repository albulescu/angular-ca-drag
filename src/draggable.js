/**
 * Drag & Drop AngularJS Module
 * https://github.com/albulescu/angular-ca-drag
 *
 * Author Albulescu Cosmin <cosmin@albulescu.ro>
 * Licensed under the MIT license.
 */

'use strict';

angular.module('caDrag')

/**
 * DragElement
 */
.service('DraggableElement', function($rootScope, $timeout, $document, $compile, DragUtil) {

    var returnTrue = function() {
        return true;
    };

    var returnFalse = function() {
        return false;
    };

    /**
     * Event class used to dispatch to events to the outside
     * @param {string} type   The event type
     * @param {DraggableElement}
     * @param {MouseEvent}
     */
    var DragEvent = function(type, target, original) {
        this.type = type;
        this.target = target;
        this.element = target.element;
        this.originalEvent = original;
    };

    DragEvent.prototype = {
        constructor: DragEvent,
        isDefaultPrevented: returnFalse,
        isPropagationStopped: returnFalse,
        isImmediatePropagationStopped: returnFalse,

        preventDefault: function() {
            var e = this.originalEvent;

            this.isDefaultPrevented = returnTrue;

            if (e && e.preventDefault) {
                e.preventDefault();
            }
        },
        stopPropagation: function() {
            var e = this.originalEvent;

            this.isPropagationStopped = returnTrue;

            if (e && e.stopPropagation) {
                e.stopPropagation();
            }
        },
        stopImmediatePropagation: function() {
            var e = this.originalEvent;

            this.isImmediatePropagationStopped = returnTrue;

            if (e && e.stopImmediatePropagation) {
                e.stopImmediatePropagation();
            }

            this.stopPropagation();
        }
    };

    var $body = $document.find('body');

    var DraggableElementWrapper = function(element) {

        /**
         * Data for dragging element
         */
        var _data,
            
            _clickEvent,

            /**
             * Indicating that dragging is active for this dragging element
             * @type {Boolean}
             */
            _dragging = false,
            /**
             * @type {DomElement}
             */
            _element,

            /**
             * Keep events for this dragging element
             */
            _events,

            /**
             * Show dragging feedback accept | reject
             */
            _feedback,

            /**
             * Dragging clone
             */
            _indicator,

            /**
             * Starting position of dragging
             */
            _offset,

            _type = null,

            _options = {},

            _startEvent;


        var supportsCSSText = getComputedStyle(document.body).cssText !== '';

        function copyCSS(elem, origElem) {

            var computedStyle = getComputedStyle(origElem);

            if (supportsCSSText) {
                elem.style.cssText = computedStyle.cssText;

            } else {

                // Really, Firefox?
                for (var prop in computedStyle) {
                    if (isNaN(parseInt(prop, 10)) && typeof computedStyle[prop] !== 'function' && !(/^(cssText|length|parentRule)$/).test(prop)) {
                        elem.style[prop] = computedStyle[prop];
                    }
                }

            }

        }

        function inlineStyles(elem, origElem) {

            var children = elem.querySelectorAll('*');
            var origChildren = origElem.querySelectorAll('*');

            // copy the current style to the clone
            copyCSS(elem, origElem, 1);

            // collect all nodes within the element, copy the current style to the clone
            Array.prototype.forEach.call(children, function(child, i) {
                copyCSS(child, origChildren[i]);
            });

            // strip margins from the outer element
            elem.style.margin = elem.style.marginLeft = elem.style.marginTop = elem.style.marginBottom = elem.style.marginRight = '';

        }

        var createIndicator = function(callback) {

            var factory = ( _options.indicatorFactory || angular.noop );
            var indicator = factory( _type );

            if (indicator) {
                var scope = $rootScope.$new(true);

                $compile(indicator)(scope);

                scope.$apply(function() {
                    //set data to the scope
                    angular.forEach(_data, function(value, key) {
                        scope[key] = value;
                    });
                });

                _indicator = indicator;
                _indicator.css('display', 'block');

                callback();
            } else {

                _indicator= angular.element('<div>');

                var clone = _element[0].cloneNode(true);

                var rect = DragUtil.getRect( _element[0] );

                clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');

                // inline all CSS (ugh..)
                inlineStyles(clone, _element[0]);

                var serialized = new XMLSerializer().serializeToString(clone);

                // Create well formed data URL with our DOM string wrapped in SVG
                var dataUri = '<svg xmlns="http://www.w3.org/2000/svg" width="' + rect.width + '" height="' + rect.height + '">' +
                    '<foreignObject width="100%" height="100%" >' +
                    serialized +
                    '</foreignObject>' +
                    '</svg>';

                _indicator.append(dataUri);

                $body.append(_indicator);

                _indicator.css({
                    'width': rect.width + 'px',
                    'height': rect.height + 'px',
                });

                callback();
            }

            _indicator.css({
                'cursor': 'move',
                'pointer-events': 'none',
                'position': 'absolute',
                'zIndex': '10000'
            });

            _indicator.addClass('ca-drag');

            if (_options.showFeedback) {

                _feedback = angular.element('<div class="feedback reject"></div>');

                _indicator.append(_feedback);
            }

            $body.append(_indicator);
        };

        var prepareForDragging = function(event) {

            createIndicator(function() {
                _startEvent = event;

                _offset = DragUtil.getRect(_element[0]);

                $timeout(function() {
                    updateMovePosition(event);
                });
            });
        };

        var updateMovePosition = function(event) {

            var x = 0,
                y = 0;

            var pointerPos      = DragUtil.getEventPosition(event);
            var startPosition   = DragUtil.getEventPosition(_startEvent);
            var indRect         = DragUtil.getRect(_indicator[0]);

            switch ( _options.dragPosition ) {
                case 'center':
                    x = pointerPos.x + _options.dragOffset[0] - (indRect.width / 2);
                    y = pointerPos.y + _options.dragOffset[1] - (indRect.height / 2);
                    break;
                case 'clone':
                    x = _offset.left - startPosition.x + pointerPos.x + _options.dragOffset[0];
                    y = _offset.top - startPosition.y + pointerPos.y + _options.dragOffset[1];
                    break;
                default:
                case 'corner':
                    x = pointerPos.x + _options.dragOffset[0];
                    y = pointerPos.y + _options.dragOffset[1];
                    break;
            }

            _indicator.css({
                left: x + 'px',
                top: y + 'px',
            });
        };

        var DraggableElement = function(element) {

            _element = element;

            var _self = this;

            var onMouseUp = function(event) {

                _dragging = false;

                if (_indicator) {
                    _indicator.remove();
                }

                $document.unbind('touchmove mousemove', onMouseMove);
                $document.unbind('touchend mouseup', onMouseUp);

                _self.emit('complete', new DragEvent('drag.complete', _self, event));
            };

            var onMouseMove = function(event) {

                if (_dragging) {
                    event.preventDefault();
                    updateMovePosition(event);
                    _self.emit('dragging', new DragEvent('drag.move', _self, event));
                    return;
                }

                var distance = DragUtil.getEventsDistance(_clickEvent, event);

                if (!_dragging && distance > _options.startDistance) {
                    _dragging = true;
                    prepareForDragging(event);
                    _self.emit('start', new DragEvent('drag.start', _self, event));
                }
            };

            element.bind('touchstart mousedown', function(event) {
                event.preventDefault();
                _clickEvent = event;
                $document.bind('touchmove mousemove', onMouseMove);
                $document.bind('touchend mouseup', onMouseUp);
            });


            this.cancel = function() {
                onMouseUp();
            };
        };

        DraggableElement.prototype = {

            on: function(event, fct) {
                _events = _events || {};
                _events[event] = _events[event] || [];
                _events[event].push(fct);
            },

            off: function(event, fct) {
                _events = _events || {};
                if (event in _events === false) {
                    return;
                }
                _events[event].splice(_events[event].indexOf(fct), 1);
            },

            emit: function(event /* , args... */ ) {
                _events = _events || {};
                if (event in _events === false) {
                    return;
                }
                for (var i = 0; i < _events[event].length; i++) {
                    _events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
                }
            },

            setOptions: function(options) {
                _options = options;
            },

            setType: function(type) {
                _type = type;
            },

            getType: function() {
                return _type;
            },

            event: function(name, original) {
                return new DragEvent(name, this, original);
            },

            setFeedback: function(feedback) {
                if (_options.showFeedback) {
                    _feedback.attr('class', 'feedback ' + feedback);
                }
            },

            get dragging() {
                return _dragging;
            },

            set data(data) {
                _data = data;
            },

            get data() {
                return _data;
            },

            get element() {
                return _element;
            }
        };


        return new DraggableElement(element);
    };

    return DraggableElementWrapper;
});