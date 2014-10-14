Drag &amp; Drop Module for AngularJs
======

Installation
--
```bower install angular-ca-drag --save```

Services
--
- **DragManager** - Handle drag & drop support for draggable elements
- **DraggableElement** - A decorator class that add drag functionality to a dom element
- **DragUtil** - Utils for dragging

Directives
--
- **ca-drag-data** - Add data to pass to the drag event
- **ca-drag-type** - Type of current dragging element
- **ca-drag-enabled** - Enable dragging on the element
- **ca-drag-begin** - Callback to be called when start dragging, this will automatically enable dragging on the element
- **ca-drag-move** - Callback to be called when dragging, this will automatically enable dragging on the element
- **ca-drag-complete** - Callback to be called when dragging complete, this will automatically enable dragging on the element
- **ca-drag-indicator** - Indicator used for dragging. Specify param value for custom types ```ca-drag-indicator="song"```
- **ca-drop-type** - Allowed types for dropping
- **ca-drop-hover** - Callback to be called when draggable element is over the drop zone
- **ca-drop-complete** - Callback to be called when drop some element. This will automatically set element as drop zone
- **ca-drop-accept** - Set element as drop zone
- **ca-drop-model** - Add this to drop element to auto update scope data

Demo
--
[http://albulescu.github.io/angular-ca-drag/][demo]

[demo]:http://albulescu.github.io/angular-ca-drag/

