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
 * Direcrive to specify data to keep in drag event.
 * This will automatically convert the element to
 * draggable element.
 */
.directive('caDragData', function(DragManager) {
    return {
        restrict: 'A',
        link: function(scope, element, attributes) {

            var dragElement = DragManager.register(element);

            if (attributes.caDragData) {
                dragElement.data = scope.$eval(attributes.caDragData);
            }
        }
    };
})

/**
 * Enable dragging of the element
 */
.directive('caDragEnabled', function(DragManager) {
    return {
        restrict: 'A',
        link: function(scope, element) {
            DragManager.register(element);
        }
    };
})

.directive('caDropType', function(DragManager) {
    return {
        restrict: 'A',
        link: function(scope, element, attributes) {
            DragManager.addDropTarget(element, scope);
            element.data('ca-drop-type', attributes.caDropType);
        }
    };
})

.directive('caDragIndicator', function(DragManager) {
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
})

.directive('caDragBegin', function(DragManager, $parse) {
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
})

.directive('caDragMove', function(DragManager, $parse) {
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
})

/**
 * Handler for dragging complete
 */
.directive('caDragComplete', function(DragManager, $parse) {
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
})

/**
 * Register element as a drop target
 */
.directive('caDropComplete', function($parse, DragManager) {
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
})

/**
 * Hook for drop over
 */
.directive('caDropHover', function($parse, DragManager) {
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
})

/**
 * Register element as a drop target
 */
.directive('caDropAccept', function(DragManager) {
    return {
        restrict: 'A',
        link: function(scope, element) {
            DragManager.addDropTarget(element, scope);
        }
    };
});