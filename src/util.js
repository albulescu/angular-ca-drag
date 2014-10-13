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
	 * Check if event is over the element
	 * @param  {Event}  event   MouseEvent or TouchEvent
	 * @param  {Element}  element Dom element
	 * @return {Boolean}
	 */
	this.isHover = function(event, element) {
		console.log(event, element);
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