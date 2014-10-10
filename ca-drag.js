/**
 * Drag & Drop AngularJS Module
 * https://github.com/albulescu/caDrag
 *
 * Author Albulescu Cosmin <cosmin@albulescu.ro>
 * Licensed under the MIT license.
 */

'use strict'

angular.module('caDrag', [])

.service('DragManager', function( $document, $timeout, DraggableElement ){

    var feedback = null;

    var _dragging = false;

    var _draggingDelayed = false;

    var _elements = []

    var _targets = [];

    var _active = null;

    var _dropzone = false;

    var onDragStart = function( event ) {
        _active = this;
        console.log(this);
        $timeout(function(){
            _dragging = true;
        });
    };

    var onDragMove = function(event) {
        
        var path = event.originalEvent.originalEvent.path;

    };

    var onDropTargetOver = function(event) {
        if( _dragging ) {
            _dropzone = dropZoneByElement( event.target );
            angular.element(event.target).css('border','1px solid yellow')
        }
    };
    
    var onDropTargetOut = function(event) {
        _dropzone = null;
        angular.element(event.target).css('border','none');
    };


    var dropZoneByElement = function( element ) {
        
        for(var i=0; i < _targets.length; i++) {
            if( element == _targets[i].element[0] ) {
                return _targets[i];
            }
        }

        return null;
    };

    var onDragComplete = function( event ) {
        
        if(!_dropzone) {
            return;
        }
        
        var dropModel = _dropzone.element.attr('ca-drop-model');


        if( !event.isDefaultPrevented() ){
            //highlight drop zone
            _dropzone.element.css('border','none');
            //remove dragging element from his original place
            var element = event.element.detach();
            //attach element to the drop zone
            _dropzone.element.append(element);
        }

        if( dropModel ) {
            //get the scope model to update
            var model = _dropzone.scope[ dropModel ];
            
            if( angular.isDefined( model ) )
            {
                if( angular.isArray(model) ) {
                    //push into if is array
                    model.push( event.target.data);
                } else {
                    //replace if object
                    _dropzone.scope[ dropModel ] = event.target.data;
                }
            }
        }

        // callback call
        _dropzone.callback( _dropzone.scope, { $event : event });

        _active = null;

        $timeout(function(){ _dragging = false; });
    };

    var DragManager = {

        COPY: 'copy',

        LINK: 'link',

        MOVE: 'move',

        NONE: 'none',

        addDropTarget : function( element, scope, callback ){
            _targets.push({
                element : element,
                scope: scope,
                callback : callback
            });

            element.hover(onDropTargetOver, onDropTargetOut)
        },

        register: function( element ) {

            var dragElement = element.data('ca-drag');

            if( dragElement ) {
                return dragElement;
            }

            dragElement = new DraggableElement(element);

            dragElement.on('start', onDragStart);
            dragElement.on('dragging', onDragMove);
            dragElement.on('complete', onDragComplete);

            element.data('ca-drag', dragElement);

            _elements.push( dragElement );

            return dragElement;
        },
    }

    Object.defineProperty(DragManager, 'dragging', {
        get: function() {
            return _dragging;
        }
    });

    Object.defineProperty(DragManager, 'active', {
        get: function() {
            return _active;
        }
    });

    return DragManager;
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
            _indicator.width(img.width());
            _indicator.height(img.height());
            _indicator.css({
                opacity: '.6',
                '-ms-transform': 'scale(.9,.9)',
                '-webkit-transform': 'scale(.9,.9)',
                'transform': 'scale(.9,.9)',
                'pointer-events': 'none'
            });
            $body.append(_indicator);
        };

        var prepareForDragging = function( event ) {
            
            createIndicator();

            _startEvent = event;

            _offset = _element.offset();  
            
            _indicator.css({
                position:'absolute',
                left : _offset.left,
                top : _offset.top,
                zIndex: '10000'
            });
        };

        var updateMovePosition = function( event ) {

            var x = _startEvent.pageX - event.pageX;
            var y = _startEvent.pageY - event.pageY;

            _indicator.css({
                left : _offset.left - x,
                top : _offset.top - y,
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

                event.preventDefault();
                
                clearTimeout(_startIntv);
                
                _dragging = false;

                restoreDragging( event );

                $document.unbind('touchmove mousemove', onMouseMove);
                $document.unbind('touchend mouseup', onMouseUp);

                _self.emit('complete', new DragEvent( 'complete', _self, event ));
            };

            var onMouseMove = function( event ) {
                event.preventDefault();
                updateMovePosition( event );
                _self.emit('dragging', new DragEvent( 'dragging', _self, event ));
            };


            element.bind('touchstart mousedown', function(event){

                event.preventDefault();

                _startIntv = setTimeout(function(){
                    _dragging = true;
                    prepareForDragging( event );
                    _self.emit('start', new DragEvent( 'start', _self, event ));
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
.directive('caDropSuccess', function( $parse, DragManager ){
    return {
        restrict : 'A',
        link : function( scope, element, attributes ) {
            
            var fn = angular.noop;

            if( attributes.caDropSuccess ) {
                fn = $parse(attributes.caDropSuccess);
            }

            DragManager.addDropTarget( element, scope, fn );
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
            DragManager.addDropTarget( element, scope, angular.noop );
        }
    }
});
