/**
 * Drag & Drop AngularJS Module
 * https://github.com/albulescu/angular-ca-drag
 *
 * Author Albulescu Cosmin <cosmin@albulescu.ro>
 * Licensed under the MIT license.
 */

'use strict';

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