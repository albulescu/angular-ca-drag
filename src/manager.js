/**
 * Drag & Drop AngularJS Module
 * https://github.com/albulescu/angular-ca-drag
 *
 * Author Albulescu Cosmin <cosmin@albulescu.ro>
 * Licensed under the MIT license.
 */

'use strict';

angular.module('caDrag',[])

.provider('DragManager', function(){

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

    this.$get = ['$document', '$timeout', '$log', 'DraggableElement', 'DragUtil',
        function($document,    $timeout, $log,  DraggableElement, DragUtil){

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

        var dropZoneHover = function() {

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
        };

        var onDragMove = function( event ) {

            var target;
            var pos = DragUtil.getEventPosition( event );
            
            forEach(_targets, function(item){
                var rect = item[0].getBoundingClientRect();
                if( rect.left < pos.x && rect.right > pos.x && 
                    rect.top < pos.y && rect.bottom > pos.y )
                {
                    target = item;
                    return true;
                }
            });
            
            if( target) {

                var dragType = _active.getType();
                var dropType = target.data('ca-drop-type') || false;

                if( dragType !== dropType ) {
                    return;
                }

                if(!_dropzone) {
                    _dropzone = target;
                    dropZoneHover( event );
                }

            } else {
                onDropTargetOut();
            }
        };

        /**
         * If dragging active search if current hover element
         * is a drop zone.
         */
        var onDropTargetHover = function( event ) {

            if( _dragging ) {
                
                //search drop zone by current hover element
                _dropzone = dropZoneByElement( event.currentTarget );

                if( _dropzone ) {
                   dropZoneHover( event );
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

            var indicator;

            if( angular.isDefined( _indicators[type] )) {
                indicator = angular.element(_indicators[type] );
            } else {
                indicator = angular.element( _indicators['default'] );
            }

            indicator.css('pointer-events','none');

            return indicator;
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

                if( _targets.indexOf(element) !== -1 ) {
                    return;
                }

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

                if( !DragUtil.isMobile() ) {
                    //add handlers to drop zone
                    element.on('mouseover',onDropTargetHover);
                    element.on('mouseout', onDropTargetOut);
                }

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
                
                if( DragUtil.isMobile() ) {
                    draggable.on('dragging', onDragMove);
                }

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