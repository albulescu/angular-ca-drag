angular.module('dragging',['caDrag'])

.config(function(DragManagerProvider){
    DragManagerProvider.setDragPosition('clone')
})

.controller('test', function($scope, DragManager){
    
    $scope.man = [
        {name:'Alexander', age:21},
        {name:'Eduardo', age:21},
        {name:'Carl', age:10},
        {name:'Erick', age:15},
        {name:'Tomas', age:21},        
    ];
    
    $scope.woman = [
        {name:'Marcella', age:21},
        {name:'Krista', age:35},
        {name:'Marcia', age:12},
        {name:'Georgia', age:41},
        {name:'Kelly',age:14}    
    ];
    
    $scope.checkAge = function( event ) {
        if( event.target.data.age < 18 ) {
            event.preventDefault(); 
            event.target.setFeedback('reject');
        }
    };
    
    $scope.onManDrop = function(event) {
        
        if(event.target.data.age < 18) {
            return event.preventDefault();
        }
        
        alert('Drop man:' + event.target.data.name);
    };
    
    $scope.onWomanDrop = function(event) {
        
        if(event.target.data.age < 18) {
            return event.preventDefault();
        }
        
        alert('Drop womman:' + event.target.data.name);
    };
});