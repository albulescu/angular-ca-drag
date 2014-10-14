/**
* Drag & Drop AngularJS Module v1.1.1
* https://github.com/albulescu/caDrag
*
* Author Albulescu Cosmin <cosmin@albulescu.ro>
* Licensed under the MIT license.
*/

'use strict';

angular.module('caDrag', [])

.provider('DragManager', function() {

    var options = {
        /**
         * The distance from the click point to
         * start the dragging
         * @type {Number}
         */
        startDistance: 20,

        /**
         * Show drop accept | reject feedback
         * @type {Boolean}
         */
        showFeedback: true,

        /**
         * Drag indicator offset
         * @type {Array}
         */
        dragOffset: [0, 0],

        /**
         * Position of the indicator
         * @type {String}
         */
        dragPosition: 'corner',

        /**
         * Indicator scale
         * @type {Number}
         */
        indicatorScale: 1,

        /**
         * Custom indicator style
         * @type {Array}
         */
        indicatorStyle: {},

        /**
         * Factory for creating custom indicators
         * @type {[type]}
         */
        indicatorFactory: null
    };

    this.setDragOffset = function(x, y) {
        options.dragOffset = [x || 0, y || 0];
    };

    this.setDragPosition = function(position) {

        options.dragPosition = position || options.dragPosition;

        if( options.dragOffset[0] === 0 && options.dragOffset[1] === 0) {
            this.setDragOffset(20,20);
        }
    };

    this.setIndicatorScale = function(n) {
        options.indicatorScale = n || options.indicatorScale;
    };

    this.setIndicatorStyle = function(style) {
        options.indicatorStyle = style || options.indicatorStyle;
    };

    this.setIndicatorFactory = function(func) {
        options.indicatorFactory = func;
    };

    this.setStartDistance = function(distance) {
        options.startDistance = distance || options.startDistance;
    };

    this.$get = ['$document', '$timeout', '$log', 'DraggableElement', 'DragUtil',
        function($document, $timeout, $log, DraggableElement, DragUtil) {

            var forEach = angular.forEach,
                isDefined = angular.isDefined;
            /**
             * Flag indicating that dragging is active
             * @type {Boolean}
             */
            var _dragging = false,

                /**
                 * Registered dragging elements
                 * @type {DraggingElement[]}
                 */
                _elements = [],

                /**
                 * Registered drop targets
                 * @type {Array}
                 */
                _targets = [],

                /**
                 * Active dragging element
                 * @type {DraggingElement}
                 */
                _active = null,

                _indicators = false,

                /**
                 * Current drop zone
                 * @type {Object}
                 */
                _dropzone = false;

            /**
             * Set flags when start dragging to check if
             * we are on a drop zone
             */
            var onDragStart = function() {
                _active = this;
                _dragging = true;
            };

            var dropZoneHover = function() {

                //get callback
                var over = _dropzone.data('ca-drop-hover') || angular.noop;
                //create event for scope
                var overEvent = _active.event('drop.over', event.originalEvent);

                //trigger drop over
                over(_dropzone.data('ca-drop-scope'), {
                    $event: overEvent
                });
                //add class to highlight drop zone
                _dropzone.addClass('ca-drag-over');

                if (overEvent.isDefaultPrevented() === false) {
                    _active.setFeedback('accept');
                }
            };

            var onDragMove = function(event) {

                var target;
                var pos = DragUtil.getEventPosition(event);

                forEach(_targets, function(item) {
                    var rect = item[0].getBoundingClientRect();
                    if (rect.left < pos.x && rect.right > pos.x &&
                        rect.top < pos.y && rect.bottom > pos.y) {
                        target = item;
                        return true;
                    }
                });

                if (target) {

                    var dragType = _active.getType();
                    var dropType = target.data('ca-drop-type') || false;

                    if (dragType !== dropType) {
                        return;
                    }

                    if (!_dropzone) {
                        _dropzone = target;
                        dropZoneHover(event);
                    }

                } else {
                    onDropTargetOut();
                }
            };

            /**
             * If dragging active search if current hover element
             * is a drop zone.
             */
            var onDropTargetHover = function(event) {

                if (_dragging) {

                    //search drop zone by current hover element
                    _dropzone = dropZoneByElement(event.currentTarget);

                    if (_dropzone) {
                        dropZoneHover(event);
                    }
                }
            };

            /**
             * Called when move out from drop zone
             */
            var onDropTargetOut = function() {
                if (_dropzone) {
                    _dropzone.removeClass('ca-drag-over');
                    _dropzone = null;
                }
                if (_active) {
                    _active.setFeedback('reject');
                }
            };

            /**
             * Search drop zone by given element from mouse move event
             */
            var dropZoneByElement = function(element) {

                element = angular.element(element);

                for (var i = 0; i < _targets.length; i++) {

                    var target = _targets[i];

                    if (element[0] === target[0]) {

                        var dragType = _active.getType();
                        var dropType = target.data('ca-drop-type') || false;

                        if ((dragType || dropType) && dragType !== dropType) {
                            return null;
                        }

                        return target;
                    }
                }

                return null;
            };

            /**
             * Handler called when drag complete
             */
            var onDragComplete = function(event) {

                //set dragging flag to false. Set delayed to have posibility
                //to stop click event propagation on the dragging element
                $timeout(function() {
                    _dragging = false;
                });

                if (!_dropzone) {
                    _active = null;
                    return;
                }

                var dropModel = _dropzone.attr('ca-drop-model');
                //get the scope model to update
                var scope = _dropzone.data('ca-drop-scope');
                // callback call  
                var complete = _dropzone.data('ca-drop-complete') || angular.noop;
                //do callback
                complete(scope, {
                    $event: event
                });

                if (!event.isDefaultPrevented()) {
                    //remove dragging element from his original place
                    var element = event.element.remove();
                    //attach element to the drop zone
                    _dropzone.append(element);
                }

                if (dropModel) {
                    var model = scope[dropModel];

                    if (isDefined(model)) {
                        if (angular.isArray(model)) {
                            //push into if is array
                            model.push(event.target.data);
                        } else {
                            //replace if object
                            scope[dropModel] = event.target.data;
                        }
                    }
                }

                _active = null;
            };

            if(!options.indicatorFactory)
            {
                options.indicatorFactory = function(type) {

                    if(!_indicators) {
                        return null;
                    }

                    var indicator;

                    if (isDefined(_indicators[type])) {
                        indicator = angular.element(_indicators[type]);
                    } else if(isDefined(_indicators['default'])) {
                        indicator = angular.element(_indicators['default']);
                    } else {
                        return null;
                    }

                    indicator.css('pointer-events', 'none');

                    return indicator;
                };    
            }


            var DragManager = {

                /**
                 * Cancel current dragging element
                 */
                cancel: function() {

                    if (!_active) {
                        return false;
                    }

                    _active.cancel();

                    return true;
                },

                /**
                 * Add drop target element
                 * @param {DomElement} element Dom element
                 * @param {Scope}   scope    Angular scope
                 * @param {Function} Callback method called when drop over
                 * @param {Function} Callback method called when drop complete
                 */
                addDropTarget: function(element, scope, over, complete) {

                    if (_targets.indexOf(element) !== -1) {
                        return;
                    }

                    var dropzone = element.data('ca-drap-scope');

                    //Skip if element is already decorated with dragging class
                    if (dropzone) {
                        return dropzone;
                    }

                    //store the scope to element
                    element.data('ca-drop-scope', scope);

                    //set drop over function if available
                    if (angular.isFunction(over)) {
                        element.data('ca-drop-hover', over);
                    }

                    //set drop complete function if available
                    if (angular.isFunction(complete)) {
                        element.data('ca-drop-complete', complete);
                    }

                    if (!DragUtil.isMobile()) {
                        //add handlers to drop zone
                        element.on('mouseover', onDropTargetHover);
                        element.on('mouseout', onDropTargetOut);
                    }

                    //save drop target object
                    _targets.push(element);
                },

                /**
                 * Register new dragging indicator
                 */
                registerIndicator: function(html, type) {

                    if (isDefined(_indicators[type || 'default'])) {
                        throw new Error('This indicator already registered');
                    }

                    _indicators = _indicators || {};

                    _indicators[type || 'default'] = html;
                },

                /**
                 * Create draggable element
                 * @param  Dom element
                 * @return DraggableElement
                 */
                register: function(element) {

                    var draggable = element.data('ca-drag');

                    //Skip if element is already decorated with dragging class
                    if (draggable) {
                        return draggable;
                    }

                    //create draggable element from dom element
                    draggable = new DraggableElement(element);

                    draggable.setOptions(options);

                    draggable.setType(element.attr('ca-drag-type'));

                    //add handlers for drag manager for drop functionality
                    draggable.on('start', onDragStart);
                    draggable.on('complete', onDragComplete);

                    if (DragUtil.isMobile()) {
                        draggable.on('dragging', onDragMove);
                    }

                    //add drag decorator as data to current element
                    element.data('ca-drag', draggable);

                    //store element in manager
                    _elements.push(draggable);

                    return draggable;
                },
            };

            /**
             * Dragging flag getter
             */
            Object.defineProperty(DragManager, 'dragging', {
                get: function() {
                    return _dragging;
                }
            });

            /**
             * Getter to get the active DraggingElement
             */
            Object.defineProperty(DragManager, 'active', {
                get: function() {
                    return _active;
                }
            });

            return DragManager;
        }
    ];
});

angular.module('caDrag')

/**
 * DragElement
 */
.service('DraggableElement', ["$rootScope", "$timeout", "$document", "$compile", "DragUtil", function($rootScope, $timeout, $document, $compile, DragUtil) {

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
            _rect,

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

        var createIndicator = function() {

            var factory = (_options.indicatorFactory || angular.noop);
            var indicator = factory(_type);

            if (indicator) {

                var scope = $rootScope.$new(true);

                $compile(indicator)(scope);

                scope.$apply(function() {
                    //set data to the scope
                    angular.forEach(_data, function(value, key) {
                        scope[key] = value;
                    });
                });

                indicator.css('display', 'block');

            } else {

                indicator = angular.element('<div>');

                var clone = _element[0].cloneNode(true);

                clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');

                // inline all CSS (ugh..)
                inlineStyles(clone, _element[0]);

                var serialized = new XMLSerializer().serializeToString(clone);

                // Create well formed data URL with our DOM string wrapped in SVG
                var dataUri = '<svg xmlns="http://www.w3.org/2000/svg" width="' + _rect.width + '" height="' + _rect.height + '">' +
                    '<foreignObject width="100%" height="100%" >' +
                    serialized +
                    '</foreignObject>' +
                    '</svg>';

                indicator.append(dataUri);
            }

            indicator.css({
                'cursor': 'move',
                'pointer-events': 'none',
                'position': 'absolute',
                'zIndex': '10000'
            });

            indicator.addClass('ca-drag');

            if (_options.showFeedback) {

                _feedback = angular.element('<div class="feedback reject"></div>');

                indicator.append(_feedback);
            }

            $body.append(indicator);

            _indicator = indicator;
        };

        var prepareForDragging = function(event) {

            _rect = DragUtil.getRect(_element[0]);

            _startEvent = event;

            createIndicator();

            updateMovePosition(event);
        };

        var updateMovePosition = function(event) {

            var x = 0,
                y = 0;

            var pointerPos = DragUtil.getEventPosition(event);
            var startPosition = DragUtil.getEventPosition(_startEvent);
            var indRect = DragUtil.getRect(_indicator[0]);

            switch (_options.dragPosition) {
                case 'center':
                    x = pointerPos.x + _options.dragOffset[0] - (indRect.width / 2);
                    y = pointerPos.y + _options.dragOffset[1] - (indRect.height / 2);
                    break;
                case 'clone':
                    x = _rect.left - startPosition.x + pointerPos.x + _options.dragOffset[0];
                    y = _rect.top - startPosition.y + pointerPos.y + _options.dragOffset[1];
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
}]);

angular.module('caDrag')

/**
 * Direcrive to specify data to keep in drag event.
 * This will automatically convert the element to
 * draggable element.
 */
.directive('caDragData', ["DragManager", function(DragManager) {
    return {
        restrict: 'A',
        link: function(scope, element, attributes) {

            var dragElement = DragManager.register(element);

            if (attributes.caDragData) {
                dragElement.data = scope.$eval(attributes.caDragData);
            }
        }
    };
}])

/**
 * Enable dragging of the element
 */
.directive('caDragEnabled', ["DragManager", function(DragManager) {
    return {
        restrict: 'A',
        link: function(scope, element) {
            DragManager.register(element);
        }
    };
}])

.directive('caDropType', ["DragManager", function(DragManager) {
    return {
        restrict: 'A',
        link: function(scope, element, attributes) {
            DragManager.addDropTarget(element, scope);
            element.data('ca-drop-type', attributes.caDropType);
        }
    };
}])

.directive('caDragIndicator', ["DragManager", function(DragManager) {
    return {
        restrict: 'A',
        compile: function(element, attributes) {
            //remove attribute to avoid recursive compiling
            element[0].removeAttribute('ca-drag-indicator');
            //get indicator html
            var container = angular.element('<div>').append(element);
            //register in drag manager
            DragManager.registerIndicator(container.html(), attributes.caDragIndicator);
            //remove it from dom
            element.remove();
        }
    };
}])

.directive('caDragBegin', ["DragManager", "$parse", function(DragManager, $parse) {
    return {
        restrict: 'A',
        link: function(scope, element, attributes) {

            var dragElement = DragManager.register(element);

            if (attributes.caDragBegin) {
                var fn = $parse(attributes.caDragBegin);
                if (angular.isFunction(fn)) {
                    dragElement.on('start', function(event) {
                        fn(scope, {
                            $event: event
                        });
                    });
                }
            }
        }
    };
}])

.directive('caDragMove', ["DragManager", "$parse", function(DragManager, $parse) {
    return {
        restrict: 'A',
        link: function(scope, element, attributes) {

            var dragElement = DragManager.register(element);

            if (attributes.caDragMove) {
                var fn = $parse(attributes.caDragMove);
                if (angular.isFunction(fn)) {
                    dragElement.on('dragging', function(event) {
                        fn(scope, {
                            $event: event
                        });
                    });
                }
            }
        }
    };
}])

/**
 * Handler for dragging complete
 */
.directive('caDragComplete', ["DragManager", "$parse", function(DragManager, $parse) {
    return {
        restrict: 'A',
        link: function(scope, element, attributes) {

            var dragElement = DragManager.register(element);

            if (attributes.caDragComplete) {
                var fn = $parse(attributes.caDragComplete);
                if (angular.isFunction(fn)) {
                    dragElement.on('complete', function(event) {
                        fn(scope, {
                            $event: event
                        });
                    });
                }
            }
        }
    };
}])

/**
 * Register element as a drop target
 */
.directive('caDropComplete', ["$parse", "DragManager", function($parse, DragManager) {
    return {
        restrict: 'A',
        link: function(scope, element, attributes) {

            var fn = angular.noop;

            if (attributes.caDropComplete) {
                fn = $parse(attributes.caDropComplete);
            }

            DragManager.addDropTarget(element, scope);

            element.data('ca-drop-complete', fn);
        }
    };
}])

/**
 * Hook for drop over
 */
.directive('caDropHover', ["$parse", "DragManager", function($parse, DragManager) {
    return {
        restrict: 'A',
        link: function(scope, element, attributes) {

            var fn = angular.noop;

            if (attributes.caDropHover) {
                fn = $parse(attributes.caDropHover);
            }

            DragManager.addDropTarget(element, scope);

            element.data('ca-drop-hover', fn);
        }
    };
}])

/**
 * Register element as a drop target
 */
.directive('caDropAccept', ["DragManager", function(DragManager) {
    return {
        restrict: 'A',
        link: function(scope, element) {
            DragManager.addDropTarget(element, scope);
        }
    };
}]);

angular.module('caDrag')

.service('DragUtil', function() {

    /**
     * Check if is on mobile
     * @return {Boolean}
     */
    this.isMobile = function() {
        return (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase()));
    };

    /**
     * Get element rectangle 
     * @param  {Element}
     * @return {Object}   With keys left,top,width,height
     */
    this.getRect = function(e) {
        return e.getBoundingClientRect();
    };

    /**
     * Get distance between two events
     * @param  {Event}
     * @param  {Event}
     * @return {Number}
     */
    this.getEventsDistance = function(a,b) {
        
        var point1 = this.getEventPosition(a);
        var point2 = this.getEventPosition(b);

        var xs = 0;
        var ys = 0;

        xs = point2.x - point1.x;
        xs = xs * xs;

        ys = point2.y - point1.y;
        ys = ys * ys;

        return Math.sqrt( xs + ys );
    };

    /**
     * Get event position
     * @param  {Event} event Touch or mouse event
     * @return {Object}      Position
     */
    this.getEventPosition = function(event) {

        var x = 0,
            y = 0;

        if (event instanceof window.TouchEvent) {
            if (event.touches && event.touches.length) {
                x = event.touches[0].pageX;
                y = event.touches[0].pageY;
            }
        } else if (angular.isDefined(event.element) && angular.isDefined(event.originalEvent)) {
            return this.getEventPosition(event.originalEvent);
        } else {
            x = event.pageX;
            y = event.pageY;
        }

        return {
            'x': x,
            'y': y
        };
    };
});