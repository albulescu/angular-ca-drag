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

    var logging = false;

    this.enableLogging = function() {
        logging = true;
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
        var onDropTargetOver = function(event) {

            if( _dragging ) {
                
                //search drop zone by current hover element
                _dropzone = dropZoneByElement( event.currentTarget );

                if( _dropzone ) {
                    //add class to highlight drop zone
                    _dropzone.addClass('ca-drag-over');
                    //get callback
                    var over = _dropzone.data('ca-drop-over') || angular.noop;
                    //trigger drop over
                    over( _dropzone.data('ca-drop-scope'), { $event : _active.event('drop.over', event.originalEvent) });
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
            
            if( !event.isDefaultPrevented() ){
                //remove dragging element from his original place
                var element = event.element.remove();
                //attach element to the drop zone
                _dropzone.append(element);
            }

            var dropModel = _dropzone.attr('ca-drop-model');
            //get the scope model to update
            var scope = _dropzone.data('ca-drop-scope');

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

            // callback call  
            var complete = _dropzone.data('ca-drop-complete') || angular.noop;     

            //do callback
            complete( scope, { $event : _active.event('drop.complete', event.originalEvent), $drop : _dropzone });

            _active = null;
        };

        var DragManager = {

            COPY: 'copy',

            LINK: 'link',

            MOVE: 'move',

            NONE: 'none',

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
.service('DraggableElement', function( $document ){

    /**
     * Event class used to dispatch to events to the outside
     * @param {string} type   The event type
     * @param {DraggableElement}
     * @param {MouseEvent}
     */
    var DragEvent = function( type, target, event ) {
        this.type = type;
        this.target = target;
        this.element = target.element;
        this.originalEvent = event;
    };

    DragEvent.prototype = {
        stopPropagation : function(){
            return this.originalEvent.stopPropagation();
        },
        preventDefault : function(){ 
            this.originalEvent.preventDefault();
        },
        isDefaultPrevented : function(){ 
            return this.originalEvent.isDefaultPrevented();
        }
    };

    var $body = $document.find('body');

    var DraggableElementWrapper = function( element ){

        var _data = null;

        var _startIntv;

        var _dragging = false;

        var _element;

        var _events;

        var _indicator;

        var _offset;

        var _size;

        /**
         * CSSStyleDeclaration
         */
        var _style;

        var _startEvent;

        var createIndicator = function() {
            var img = _element.find('img');

            _indicator = img.clone();

            _indicator.css({
                opacity: '.6',
                'width' : img.prop('offsetWidth') + 'px',
                'height' : img.prop('offsetHeight') + 'px',
                '-ms-transform': 'scale(.9,.9)',
                '-webkit-transform': 'scale(.9,.9)',
                'transform': 'scale(.9,.9)',
                'cursor': 'move',
                'pointer-events': 'none'
            });
            $body.append(_indicator);
        };

        var prepareForDragging = function( event ) {
            
            createIndicator();

            _startEvent = event;

            _offset = {
                left : _element.prop('offsetLeft'),  
                top : _element.prop('offsetTop'),  
            }
            
            _indicator.css({
                position:'absolute',
                float:'none',
                left : _offset.left + 'px',
                top : _offset.top + 'px',
                zIndex: '10000'
            });
        };

        var updateMovePosition = function( event ) {

            var x = _startEvent.pageX - event.pageX;
            var y = _startEvent.pageY - event.pageY;

            _indicator.css({
                left : (_offset.left - x) + 'px',
                top : (_offset.top - y) + 'px',
            });
        };

        var restoreDragging = function( event ) {
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

            event : function(name, original) {
                return new DragEvent( name, this, original );
            },

            cancel: function() {
                onMouseUp();
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
