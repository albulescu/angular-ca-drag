angular.module('dragging',['caDrag'])

.config(function(DragManagerProvider){
    DragManagerProvider.setDragPosition('corner')
})

.directive('console', function(){
    return {
        restrict : 'C',
        scope : true,
        link: function(scope, element) {
            scope.$watch('messages', function(){
                console.log('msg change');
                element[0].scrollTop = element[0].scrollHeight;
            });
        }
    };
})

.controller('test1', function($scope, DragManager){
    
    $scope.messages = [];

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
    
    $scope.log = function( msg ) {
        $scope.messages.push({
            text : msg,
            time : Date.now()
        });
    };

    $scope.checkAge = function( event ) {
        if( event.target.data.age < 18 ) {
            event.preventDefault(); 
            event.target.setFeedback('reject');
        }
    };
    
    $scope.onManDrop = function(event) {
        
        if(event.target.data.age < 18) {
            this.log(event.target.data.name + ' is under 18, deny adding');
            return event.preventDefault();
        }
        
        this.log('Drop man: ' + event.target.data.name);
        this.log(event.target.data);
    };
    
    $scope.onWomanDrop = function(event) {
        
        if(event.target.data.age < 18) {
            this.log(event.target.data.name + ' is under 18, deny adding');
            return event.preventDefault();
        }
        
        this.log('Drop woman: ' + event.target.data.name);
        this.log(event.target.data);
    };
});