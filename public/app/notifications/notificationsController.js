app.controller('NotificationsController', function($scope, FacebookService, $rootScope){

    var checkNotifications = setInterval(getNotifications, 2000);
    function getNotifications () {

    	FacebookService.getUserNotifications().then(function(response) {

            if($scope.notifications) {

                if($scope.notifications.forEach(function(item) { if(!item.profileImage) return true})) {

                    var k = 0;
                    $scope.notifications = response.data;
                    profileImageLoop();
                }
            }
                else{

                    var k = 0;
                    $scope.notifications = response.data;
                    profileImageLoop();
                }

            function profileImageLoop() {

                if ( response.data[k] ) {
                    FacebookService.getPictureByID( response.data[k].from.id )
                        .then( function ( url ) {
                            $scope.notifications[k++].profileImage = url;
                            if ( k < response.data.length ) {
                                setTimeout( profileImageLoop, 1 );
                            }
                        });

                }
            }
	    });

    }

    $scope.markAsRead = function (item) {

        FacebookService.deleteNotification(item);
    }
    

});