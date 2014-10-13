/**
* Drag & Drop AngularJS Module v1.1.1
* https://github.com/albulescu/caDrag
*
* Author Albulescu Cosmin <cosmin@albulescu.ro>
* Licensed under the MIT license.
*/

'use strict';

angular.module('caDrag',[])

.provider('DragManager', function(  ){

    var options = {
        showFeedback : true,
        dragOffset   : [0,0],
        dragPosition : 'corner',
        indicatorScale: 1,
        indicatorStyle : [],
        indicatorFactory : null
    };

    /**
     * Set drag ofset of the indicator
     * @param {Number}
     * @param {Number}
     */
    this.setDragOffset = function(x,y) {
        options.dragOffset = [x || 0, y || 0];
    };

    /**
     * Set drag position corner | center | clone
     * @param {string}
     */
    this.setDragPosition = function( position ) {
        options.dragPosition = position || 'corner';
    };

    this.setIndicatorScale = function( n ) {
        options.indicatorScale = n || 1;
    };

    this.setIndicatorStyle = function( style ) {
        options.indicatorStyle = style || {};
    };

    this.setIndicatorFactory = function( func ) {
        options.indicatorFactory = func;
    };

    this.$get = ['$document', '$timeout', '$log', 'DraggableElement', 
        function($document,    $timeout, $log,  DraggableElement){

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
            _targets  = [],

            /**
             * Active dragging element
             * @type {DraggingElement}
             */
            _active   = null,

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
            _active   = this;
            _dragging = true;
        };

        /**
         * If dragging active search if current hover element
         * is a drop zone.
         */
        var onDropTargetOver = function( event ) {

            if( _dragging ) {
                
                //search drop zone by current hover element
                _dropzone = dropZoneByElement( event.currentTarget );

                if( _dropzone )
                {
                    //get callback
                    var over = _dropzone.data('ca-drop-hover') || angular.noop;
                    //create event for scope
                    var overEvent = _active.event('drop.over', event.originalEvent);
                    
                    //trigger drop over
                    over( _dropzone.data('ca-drop-scope'), {$event:overEvent});
                    //add class to highlight drop zone
                    _dropzone.addClass('ca-drag-over');

                    if( overEvent.isDefaultPrevented() === false ) {
                        _active.setFeedback('accept');
                    }
                }
            }
        };
        
        /**
         * Called when move out from drop zone
         */
        var onDropTargetOut = function() {
            if( _dropzone ) {
                _dropzone.removeClass('ca-drag-over');
                _dropzone = null;
            }
            if( _active ) {
                _active.setFeedback('reject');
            }
        };

        /**
         * Search drop zone by given element from mouse move event
         */
        var dropZoneByElement = function( element ) {

            element = angular.element(element);

            for(var i=0; i < _targets.length; i++) {
                
                var target = _targets[i];

                if( element[0] === target[0]) {

                    var dragType = _active.getType();
                    var dropType = target.data('ca-drop-type') || false;
                    
                    if( (dragType||dropType) && dragType !== dropType ) {
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
        var onDragComplete = function( event ) {
            
            //set dragging flag to false. Set delayed to have posibility
            //to stop click event propagation on the dragging element
            $timeout(function(){ _dragging = false; });

            if(!_dropzone) {
                _active = null;
                return;
            }

            var dropModel = _dropzone.attr('ca-drop-model');
            //get the scope model to update
            var scope = _dropzone.data('ca-drop-scope');
            // callback call  
            var complete = _dropzone.data('ca-drop-complete') || angular.noop;     
            //do callback
            complete( scope, { $event : event });

            if( !event.isDefaultPrevented() ){
                //remove dragging element from his original place
                var element = event.element.remove();
                //attach element to the drop zone
                _dropzone.append(element);
            }

            if( dropModel )
            {
                var model = scope[ dropModel ];
                
                if( angular.isDefined( model ) )
                {
                    if( angular.isArray(model) ) {
                        //push into if is array
                        model.push( event.target.data);
                    } else {
                        //replace if object
                        scope[ dropModel ] = event.target.data;
                    }
                }
            }

            _active = null;
        };

        var indicatorFactory = function( type ) {

            if( angular.isDefined( _indicators[type] )) {
                return angular.element(_indicators[type] );
            }

            return angular.element( _indicators['default'] );
        };

        var DragManager = {

            /**
             * Cancel current dragging element
             */
            cancel : function() {
                
                if( !_active ) {
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
            addDropTarget : function( element, scope, over, complete ){

                var dropzone = element.data('ca-drap-scope');

                //Skip if element is already decorated with dragging class
                if( dropzone ) {
                    return dropzone;
                }

                //store the scope to element
                element.data('ca-drop-scope', scope);

                //set drop over function if available
                if( angular.isFunction(over) ) {
                    element.data('ca-drop-hover', over);
                }

                //set drop complete function if available
                if( angular.isFunction(complete) ) {
                    element.data('ca-drop-complete', complete);
                }

                //add handlers to drop zone
                element.on('mouseover',onDropTargetOver);
                element.on('mouseout', onDropTargetOut);

                //save drop target object
                _targets.push(element);
            },

            /**
             * Register new dragging indicator
             */
            registerIndicator : function( html, type ) {

                if( angular.isDefined( _indicators[type || 'default'] ) ) {
                    throw new Error('This indicator already registered');
                }

                _indicators = _indicators  || {};

                _indicators[ type || 'default' ] = html;
            },

            /**
             * Create draggable element
             * @param  Dom element
             * @return DraggableElement
             */
            register: function( element ) {

                var draggable = element.data('ca-drag');

                //Skip if element is already decorated with dragging class
                if( draggable ) {
                    return draggable;
                }

                //create draggable element from dom element
                draggable = new DraggableElement(element);

                draggable.setOptions( options );

                draggable.setType( element.attr('ca-drag-type') );

                if( _indicators ) {
                    draggable.setIndicatorFactory( indicatorFactory );
                }

                draggable.setDragOffset.apply(draggable, options.dragOffset);
                draggable.setDragPosition( options.dragPosition );

                //add handlers for drag manager for drop functionality
                draggable.on('start', onDragStart);
                draggable.on('complete', onDragComplete);

                //add drag decorator as data to current element
                element.data('ca-drag', draggable);

                //store element in manager
                _elements.push( draggable );

                return draggable;
            },
        };

        /**
         * Dragging flag getter
         */
        Object.defineProperty(DragManager, 'dragging', {
            get: function() { return _dragging; }
        });

        /**
         * Getter to get the active DraggingElement
         */
        Object.defineProperty(DragManager, 'active', {
            get: function() { return _active; }
        });

        return DragManager;
    }];
});

angular.module('caDrag')

/**
 * DragElement
 */
.service('DraggableElement', ["$rootScope", "$timeout", "$document", "$compile", function( $rootScope, $timeout, $document, $compile ){

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
    var DragEvent = function( type, target, original ) {
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

            if ( e && e.preventDefault ) {
                e.preventDefault();
            }
        },
        stopPropagation: function() {
            var e = this.originalEvent;

            this.isPropagationStopped = returnTrue;

            if ( e && e.stopPropagation ) {
                e.stopPropagation();
            }
        },
        stopImmediatePropagation: function() {
            var e = this.originalEvent;

            this.isImmediatePropagationStopped = returnTrue;

            if ( e && e.stopImmediatePropagation ) {
                e.stopImmediatePropagation();
            }

            this.stopPropagation();
        }
    };

    var $body = $document.find('body');

    var DraggableElementWrapper = function( element ){

            /**
             * Data for dragging element
             */
        var _data,
            /**
             * Interval used to delay drag action
             */
            _startIntv,

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

            /**
             * Drag indicator offset x
             * @type {Number}
             */
            _offsetX = 0,

            /**
             * Drag indicator offset y
             * @type {Number}
             */
            _offsetY = 0,

            _type = null,

            _indicatorFactory  = angular.noop,

            /**
             * Drag indicator position
             * @type {String}
             */
            _dragPosition = 'corner',

            /**
             * Show drag feedback
             * @type {Boolean}
             */
            _showFeedback = true,
            
            _options = {},

            _startEvent;
    

        var supportsCSSText = getComputedStyle(document.body).cssText !== '';

        function copyCSS(elem, origElem) {

            var computedStyle = getComputedStyle(origElem);

            if(supportsCSSText) {
                elem.style.cssText = computedStyle.cssText;

            } else {

                // Really, Firefox?
                for(var prop in computedStyle) {
                    if(isNaN(parseInt(prop, 10)) && typeof computedStyle[prop] !== 'function' && !(/^(cssText|length|parentRule)$/).test(prop)) {
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

        var createIndicator = function( callback ) {

            //create indicaor from user element
            var indicator = _indicatorFactory( _type );

            if( indicator )
            {
                var scope = $rootScope.$new(true);

                $compile(indicator)(scope);

                scope.$apply(function(){
                    //set data to the scope
                    angular.forEach(_data, function(value, key){
                        scope[key]=value;
                    });
                });

                _indicator = indicator;
                _indicator.show();

                callback();
            }
            else
            {
                var left = 0;
                var top = 0;
                var width =0;
                var height =0;

                var clone = _element[0].cloneNode(true);

                clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');

                // inline all CSS (ugh..)
                inlineStyles(clone, _element[0]);

                var serialized = new XMLSerializer().serializeToString(clone);

                // Create well formed data URL with our DOM string wrapped in SVG
                var dataUri = '<svg xmlns="http://www.w3.org/2000/svg" width="' + ((width || _element[0].offsetWidth) + left) + '" height="' + ((height || _element[0].offsetHeight) + top) + '">' +
                    '<foreignObject width="100%" height="100%" x="' + left + '" y="' + top + '">' +
                    serialized +
                    '</foreignObject>' +
                '</svg>';
                
                _indicator = angular.element(dataUri);


                $body.append(_indicator);
                
                _indicator.css({
                    'width' : _element.prop('offsetWidth') + 'px',
                    'height' : _element.prop('offsetHeight') + 'px',
                });

                callback();
            }

            _indicator.css({
                'cursor': 'move',
                'pointer-events': 'none',
                'position' : 'absolute',
                'zIndex': '10000'
            });

            _indicator.addClass('ca-drag');

            if( _showFeedback ) {

                _feedback = angular.element('<div class="feedback reject"></div>');

                _indicator.append(_feedback);
            }

            $body.append(_indicator);
        };

        var getOffset = function( element ) {
            return element.getBoundingClientRect();
        };

        var prepareForDragging = function( event ) {
            
            createIndicator( function() {
                _startEvent = event;

                _offset = getOffset(_element[0]);

                $timeout(function(){
                    updateMovePosition(event);
                });
            });
        };

        var updateMovePosition = function( event ) {

            var x=0, y=0;

            var indicatorProps = getOffset(_indicator[0]);

            switch( _dragPosition )
            {
                case 'center':
                    x = event.pageX + _offsetX - ( indicatorProps.width / 2 );
                    y = event.pageY + _offsetY - ( indicatorProps.height / 2 );
                break;
                case 'clone':
                    x = _offset.left - _startEvent.pageX + event.pageX + _offsetX;
                    y = _offset.top - _startEvent.pageY + event.pageY + _offsetY;
                break;
                default:
                case 'corner':
                    x = event.pageX + _offsetX;
                    y = event.pageY + _offsetY;
                    break;
            }

            _indicator.css({
                left : x + 'px',
                top : y + 'px',
            });
        };

        var restoreDragging = function() {
            if( _indicator ) {
                _indicator.remove();
            }
        };

        var DraggableElement = function( element ){
            
            _element = element;

            element.attr('dragging', 'false');

            var _self = this;

            var onMouseUp = function(event) {
                
                clearTimeout(_startIntv);
                
                _dragging = false;

                restoreDragging( event );

                $document.unbind('touchmove mousemove', onMouseMove);
                $document.unbind('touchend mouseup', onMouseUp);

                _self.emit('complete', new DragEvent( 'drag.complete', _self, event ));
            };

            var onMouseMove = function( event ) {
                event.preventDefault();
                updateMovePosition( event );
                _self.emit('dragging', new DragEvent( 'drag.move', _self, event ));
            };

            element.bind('mouseout', function(){
                if(!_dragging) {
                    clearTimeout(_startIntv);                    
                }
            });

            element.bind('touchstart mousedown', function(event){

                event.preventDefault();

                _startIntv = setTimeout(function(){
                    _dragging = true;
                    prepareForDragging( event );
                    _self.emit('start', new DragEvent( 'drag.start', _self, event ));
                    $document.bind('touchmove mousemove', onMouseMove);
                }, 300);
                
                $document.bind('touchend mouseup', onMouseUp);
            });


            this.cancel = function() {
                onMouseUp();
            };
        };

        DraggableElement.prototype =  {

            on    : function(event, fct){
                _events = _events || {};
                _events[event] = _events[event]   || [];
                _events[event].push(fct);
            },

            off  : function(event, fct){
                _events = _events || {};
                if( event in _events === false  ){ return; }
                _events[event].splice(_events[event].indexOf(fct), 1);
            },

            emit : function(event /* , args... */){
                _events = _events || {};
                if( event in _events === false  ) { return; }
                for(var i = 0; i < _events[event].length; i++){
                    _events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
                }
            },

            setOptions : function(options) {
                _options = options;
            },

            setDragOffset : function(x, y) {
                _offsetX = x;
                _offsetY = y;
            },

            setDragPosition : function( position ) {
                _dragPosition = position || 'corner';
            },

            showFeedback : function( show ) {
                _showFeedback = show;
            },

            setType : function( type ) {
                _type = type;
            },

            getType : function() {
                return _type;
            },

            setIndicatorFactory : function( func ) {
                _indicatorFactory = func;
            },

            event : function(name, original) {
                return new DragEvent( name, this, original );
            },

            setFeedback : function( feedback ) {
                
                if(!_showFeedback) {
                    return;
                }

                _feedback.attr('class','feedback ' + feedback);
            },

            get dragging() {
                return _dragging;
            },

            set data ( data ) {
                _data = data;
            },

            get data () {
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
.directive('caDragData', ["DragManager", function( DragManager ){
    return {
        restrict : 'A',
        link : function(scope, element, attributes) {
            
            var dragElement = DragManager.register( element );

            if( attributes.caDragData ) {
                dragElement.data = scope.$eval(attributes.caDragData);
            }
        }
    };
}])

/**
 * Enable dragging of the element
 */
.directive('caDragEnabled', ["DragManager", function( DragManager ){
    return {
        restrict : 'A',
        link : function(scope, element) {
            DragManager.register( element );
        }
    };
}])

.directive('caDropType', ["DragManager", function( DragManager ){
    return {
        restrict : 'A',
        link : function(scope, element, attributes) {
            DragManager.addDropTarget( element, scope );
            element.data('ca-drop-type', attributes.caDropType );
        }
    };
}])

.directive('caDragIndicator', ["DragManager", function( DragManager ){
    return {
        restrict : 'A',
        compile: function(element, attributes) {
            //remove attribute to avoid recursive compiling
            element.attr('ca-drag-indicator', null);
            //get indicator html
            var container = angular.element('<div>').append(element);
            //register in drag manager
            DragManager.registerIndicator(container.html(), attributes.caDragIndicator);
            //remove it from dom
            element.remove();
        }
    };
}])

.directive('caDragBegin', ["DragManager", "$parse", function( DragManager, $parse ){
    return {
        restrict : 'A',
        link : function( scope, element, attributes ) {
            
            var dragElement = DragManager.register( element );

            if( attributes.caDragBegin ) {
                var fn = $parse(attributes.caDragBegin);
                if( angular.isFunction(fn) ) {
                    dragElement.on('start', function( event ){
                        fn(scope, {$event:event});
                    });
                }
            }
        }
    };
}])

.directive('caDragMove', ["DragManager", "$parse", function( DragManager, $parse ){
    return {
        restrict : 'A',
        link : function( scope, element, attributes ) {
            
            var dragElement = DragManager.register( element );

            if( attributes.caDragMove ) {
                var fn = $parse(attributes.caDragMove);
                if( angular.isFunction(fn) ) {
                    dragElement.on('dragging', function( event ){
                        fn(scope, {$event:event});
                    });
                }
            }
        }
    };
}])

/**
 * Handler for dragging complete
 */
.directive('caDragComplete', ["DragManager", "$parse", function( DragManager, $parse ){
    return {
        restrict : 'A',
        link : function( scope, element, attributes ) {
            
            var dragElement = DragManager.register( element );

            if( attributes.caDragComplete ) {
                var fn = $parse(attributes.caDragComplete);
                if( angular.isFunction(fn) ) {
                    dragElement.on('complete', function( event ){
                        fn(scope, {$event:event});
                    });
                }
            }
        }
    };
}])

/**
 * Register element as a drop target
 */
.directive('caDropComplete', ["$parse", "DragManager", function( $parse, DragManager ){
    return {
        restrict : 'A',
        link : function( scope, element, attributes ) {
            
            var fn = angular.noop;

            if( attributes.caDropComplete ) {
                fn = $parse(attributes.caDropComplete);
            }

            DragManager.addDropTarget( element, scope );

            element.data('ca-drop-complete', fn );
        }
    };
}])

/**
 * Hook for drop over
 */
.directive('caDropHover', ["$parse", "DragManager", function( $parse, DragManager ){
    return {
        restrict : 'A',
        link : function( scope, element, attributes ) {
            
            var fn = angular.noop;

            if( attributes.caDropHover ) {
                fn = $parse(attributes.caDropHover);
            }

            DragManager.addDropTarget( element, scope );

            element.data('ca-drop-hover', fn );
        }
    };
}])

/**
 * Register element as a drop target
 */
.directive('caDropAccept', ["DragManager", function( DragManager ){
    return {
        restrict : 'A',
        link : function( scope, element ) {
            DragManager.addDropTarget( element, scope );
        }
    };
}]);