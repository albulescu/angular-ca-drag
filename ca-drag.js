/**
 * Drag & Drop AngularJS Module
 * https://github.com/albulescu/caDrag
 *
 * Author Albulescu Cosmin <cosmin@albulescu.ro>
 * Licensed under the MIT license.
 */

'use strict'

angular.module('caDrag', [])

.provider('DragManager', function(  ){

    var options = {
        showFeedback : true,
        dragOffset   : [0,0],
        dragPosition : 'corner'
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

    this.$get = ['$document', '$timeout', '$log', 'DraggableElement', 
        function($document,    $timeout, $log,  DraggableElement){
            /**
             * Dragging feedback indicator
             * @type {[type]}
             */
        var _feedback = null,

            /**
             * Flag indicating that dragging is active
             * @type {Boolean}
             */
            _dragging = false,
            
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

            /**
             * Current drop zone
             * @type {Object}
             */
            _dropzone = false;

        /**
         * Set flags when start dragging to check if
         * we are on a drop zone
         */
        var onDragStart = function( event ) {
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
                    var over = _dropzone.data('ca-drop-over') || angular.noop;
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
        var onDropTargetOut = function(event) {
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

            for(var i=0; i < _targets.length; i++) {
                if( element == _targets[i][0]/*jqLite*/ ) {
                    return _targets[i];
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
                    element.data('ca-drop-over', over);
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
        }

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
})


/**
 * DragElement
 */
.service('DraggableElement', function( $rootScope, $document, $compile ){

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
            /**
             * Original element size
             */
            _size,

            /**
             * Specify if indicator is a custom one used with ca-drag-clone
             * @type {Boolean}
             */
            _custom = false;

        /**
         * CSSStyleDeclaration
         */
        var _style;

        var _startEvent;

        var createClone = function() {

            var clone = _element.attr('ca-drag-clone');

            if( angular.isDefined(clone) ) {
                clone = angular.element( '#' + clone );
                _custom = true;
            }

            if( _custom && clone )
            {
                var scope = $rootScope.$new();
                
                //set data to the scope
                angular.forEach(_data, function(value, key){
                    scope[key]=value;
                });

                $compile(clone)(scope);
                scope.$apply();
                _indicator = clone;
                _indicator.show();
            }
            else
            {
                _indicator = angular.element(document.createElement('div'));

                var img = _element.find('img');

                if(img.length)
                {
                    var img = img.clone();
                    img.css({
                        'width' : _element.prop('offsetWidth') + 'px',
                        'height' : _element.prop('offsetHeight') + 'px',
                    });
                    _indicator.append( img );
                }

                _indicator.css({
                    'width' : _element.prop('offsetWidth') + 'px',
                    'height' : _element.prop('offsetHeight') + 'px',
                    '-ms-transform': 'scale(.9,.9)',
                    '-webkit-transform': 'scale(.9,.9)',
                    'transform': 'scale(.9,.9)'
                });
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
            
            createClone();

            _startEvent = event;

            _offset = getOffset(_element[0]);

            console.log(_offset);
            
            updateMovePosition(event);
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
                case 'corner':
                    x = event.pageX + _offsetX;
                    y = event.pageY + _offsetY;
                default:
            }

            _indicator.css({
                left : x + 'px',
                top : y + 'px',
            });
        };

        var restoreDragging = function( event ) {
            if( _indicator ) {
                if( _custom ) {
                    _indicator.hide();
                } else {
                    _indicator.remove();
                }
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
        }

        DraggableElement.prototype =  {

            on    : function(event, fct){
                _events = _events || {};
                _events[event] = _events[event]   || [];
                _events[event].push(fct);
            },
            
            off  : function(event, fct){
                _events = _events || {};
                if( event in _events === false  )  return;
                _events[event].splice(_events[event].indexOf(fct), 1);
            },

            emit : function(event /* , args... */){
                _events = _events || {};
                if( event in _events === false  )  return;
                for(var i = 0; i < _events[event].length; i++){
                    _events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
                }
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

            event : function(name, original) {
                return new DragEvent( name, this, original );
            },

            cancel: function() {
                onMouseUp();
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
})

.directive('caDragData', function( DragManager ){
    return {
        restrict : 'A',
        link : function(scope, element, attributes) {
            
            var dragElement = DragManager.register( element );

            if( attributes.caDragData ) {
                dragElement.data = scope.$eval(attributes.caDragData);
            }
        }
    };
})

.directive('caDragEnabled', function( DragManager ){
    return {
        restrict : 'A',
        link : function(scope, element, attributes) {
            DragManager.register( element )
        }
    };
})

.directive('caDragType', function( DragManager ){
    return {
        restrict : 'A',
        link : function(scope, element, attributes) {
            DragManager.register(element).data('ca-drag-type', attributes.caDragType );
        }
    };
})

.directive('caDropType', function( DragManager ){
    return {
        restrict : 'A',
        link : function(scope, element, attributes) {
            DragManager.addDropTarget( element, scope );
            element.data('ca-drop-type', attributes.caDropType );
        }
    };
})

.directive('caDragClone', function( DragManager ){
    return {
        restrict : 'A',
        link : function(scope, element, attributes) {
            element.data('ca-drag-clone', attributes.caDragClone );
        }
    };
})

.directive('caDragBegin', function( DragManager, $parse ){
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
})

.directive('caDragMove', function( DragManager, $parse ){
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
})

/**
 * Handler for dragging complete
 */
.directive('caDragComplete', function( DragManager, $parse ){
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
})

/**
 * Register element as a drop target
 */
.directive('caDropComplete', function( $parse, DragManager ){
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
    }
})

/**
 * Hook for drop over
 */
.directive('caDropOver', function( $parse, DragManager ){
    return {
        restrict : 'A',
        link : function( scope, element, attributes ) {
            
            var fn = angular.noop;

            if( attributes.caDropOver ) {
                fn = $parse(attributes.caDropOver);
            }

            DragManager.addDropTarget( element, scope );

            element.data('ca-drop-over', fn );
        }
    }
})

/**
 * Register element as a drop target
 */
.directive('caDropAccept', function( DragManager ){
    return {
        restrict : 'A',
        link : function( scope, element, attributes ) {
            DragManager.addDropTarget( element, scope );
        }
    }
});
