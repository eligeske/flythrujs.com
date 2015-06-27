(function(){
  angular.module('ContactManager',['ngRoute'])
  .config(function($routeProvider){
    $routeProvider.when('/',{
      redirectTo: '/login'
    })
    .when('/login',{
      templateUrl: 'app/partials/login.html',
      controller: 'loginCtrl'
    })
    .when('/contact-list',{
      templateUrl: 'app/partials/contact-list.html',
      controller: 'contactListCtrl'
    });
  })
  .controller('loginCtrl',function($scope, $location, $timeout){
    
    $scope.login = function(){
      if($scope.username == "admin" && $scope.password == "pass123"){
        $scope.loading = true;
        $timeout(function(){
          $location.path('/contact-list');  
        }, 3000);                
      }else{
        $scope.message = "Login not successful!";
      }
    }    
  })
  .controller('contactListCtrl',function($scope, $http, $filter, $location){

    // contacts
    $scope.selectedContact = false;
    if(!$scope.contactsDataUrl){
      $scope.contactsDataUrl = './data/sample-data.json';
    }
    if(!$scope.contacts){
      $scope.contacts = [];
      $scope.message = "Loading...";
      var errorText = "Could not load contacts";
      $http.get($scope.contactsDataUrl)
      .success(function(data,status){
        if(status == 200){
          $scope.contacts = data;
        }else{
          $scope.message = errorText;
        }
      }).error(function(data,status){
        $scope.message = errorText;
      });
    }
    // logout
    $scope.logout = function(){
      $location.path('/login');
    }
    // filters
    $scope.stateOptions = [];
    $scope.resetFilter = function(){
      $scope.searchParam = '';
      $scope.stateParam = '';
    }
    $scope.resetFilter();
    $scope.searchFilter = function(contact){
      var match = function(prop,value,exact){
        if(exact){
          if(!value || value === ''){ return true; }
          return (contact[prop] == value)
        }else{
          return angular.lowercase(contact[prop]).indexOf(angular.lowercase(value) || '') > -1;
        }
      }
      return ((match('first_name',$scope.searchParam)
                || match('last_name',$scope.searchParam))
                && match('state', ($scope.stateParam)?$scope.stateParam.state:'',true));
    }
    $scope.showDetails = function(contact){
        $scope.selectedContact = contact;
    }

    // paging
    $scope.filteredResults = [];
    $scope.pageSizes = [10,20,50];
    $scope.pageSize = $scope.pageSizes[1];
    $scope.page = 0;
    $scope.pages = function(){
      return Math.ceil($scope.filteredResults.length/$scope.pageSize);
    }
    $scope.$watchGroup(['pageSize','searchParam','stateParam'], function(){
      $scope.page = 0;
    });
  })
  .filter('limitFrom',function(){
    return function(arr,start){
        return arr.slice(parseInt(start));
    }
  })
  .filter('uniqueByProp',function(){
    return function (items, prop) {
      if(prop === undefined) throw 'uniqueByProp filter: prop argument is required';
      var uniqueItems = [];
      var cache = [];
      angular.forEach(items,function(item){
        if(cache.indexOf(item[prop]) < 0){
          uniqueItems.push(item);
          cache.push(item.state);
        }
      });
      return uniqueItems;
    }
  });
})();
