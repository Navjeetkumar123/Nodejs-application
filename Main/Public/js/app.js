var app = angular.module('MyApp', ['ngRoute']).config(
    ['$routeProvider', function($routeProvider) {
        $routeProvider.when('/index', {
            templateUrl: 'partials/home.html',
            //controller : MainController
        })
        .when('/', {
                templateUrl : 'partials/dashboard.html',
                
            })
        .when('/dashboard', {
            templateUrl: 'partials/dashboard.html',
        })
        .when('/sub_alloc_req', {
            templateUrl: 'partials/sub_alloc_req.html',
        })
        .when('/transact_history', {
            templateUrl: 'partials/transact_history.html',
        })
        .when('/viewAccountdetails1', {
            templateUrl: 'partials/viewAccountdetails1.html',
        })
        .when('/viewAccountdetails2', {
            templateUrl: 'partials/viewAccountdetails2.html',
        })
        .when('/viewAccountdetails3', {
            templateUrl: 'partials/viewAccountdetails3.html',
        })
         .when('/transact_history2', {
            templateUrl: 'partials/transact_history2.html',
        })
          .when('/transact_history3', {
            templateUrl: 'partials/transact_history3.html',
        })
        .when('/p_home', {
            templateUrl: 'partials/p_home.html',
        })
        .when('/p_myTransaction', {
            templateUrl: 'partials/p_myTransaction.html',
        })
        .when('/p_SegAcc', {
            templateUrl: 'partials/p_SegAcc.html',
        })
         .when('/p_SegAcc2', {
            templateUrl: 'partials/p_SegAcc2.html',
        })
        .when('/p_allocationHistory', {
            templateUrl: 'partials/p_allocationHistory.html',
        })
        .when('/p_longboxAccount', {
            templateUrl: 'partials/p_longboxAccount.html',
        })
        .when('/p_pendingRequest', {
            templateUrl: 'partials/p_pendingRequest.html',
        })
        
         .when('/p_addSecurity', {
            templateUrl: 'partials/p_addSecurity.html',
        })
        .when('/p_allocationHistory2', {
            templateUrl: 'partials/p_allocationHistory2.html',
        })
        
         .when('/p_myTransaction2', {
            templateUrl: 'partials/p_myTransaction2.html',
        })
        .when('/p_myTransaction3', {
            templateUrl: 'partials/p_myTransaction3.html',
        })
    }]);
app.directive('fileModel', ['$parse', function($parse) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;
            element.bind('change', function() {
                scope.$apply(function() {
                    modelSetter(scope, element[0].files[0]);
                });
            });
        }
    };
}]);