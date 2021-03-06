app.factory("FacebookService", function ($location, $q, $http) {

    var id = "1480652358834115",
        limit = '50',
        uid, //user's id
        accessToken,
        userProfilePicture,
        status,
        redirect = false,
        since = 'last week';
    FB.init({
        appId: id,
        status: true, // check login status
        cookie: true, // enable cookies to allow the server to access the session
        xfbml: true, // parse XFBML
        read_stream: true,
        manage_notifications: true,
        user_groups: true,
        version: 'v1.0'
    });
    
    return {
        login: function () {
            var deferred = $q.defer();

            FB.getLoginStatus(function (response) {

                if (response.status === 'connected') {

                    uid = response.authResponse.userID;
                    accessToken =  response.authResponse.accessToken;
                }
                else {
                    FB.login(function(response){status='connected';},
                        {scope:'user_status,'+
                        'user_photos,'+
                        'read_stream,'+
                        'publish_stream,'+
                        'user_likes,'+
                        'publish_actions,'+
                        'read_friendlists,'+
                        'manage_notifications,'+
                        'rsvp_event,'+
                        'user_groups,'+
                        'user_events,'+
                        'friends_photos,' +
                        'friends_likes'
                        });
                }
                FB.api(
                    "/me/picture",
                    function (response) {
                        if (response && !response.error) {
                            userProfilePicture=response.data.url;
                            status='connected';
                            deferred.resolve();
                        }
                    }
                );
            });
            

            return deferred.promise;
        },
        loggedInRedirect: redirect,
        logout: function(){
            status = 'not-connected';
            FB.logout();
            var deferred = $q.defer();

            $http({ method: 'GET', url: '/logout' }).success(function () {
                $location.path('/');
            }).error(function(err){
                alert('Couldnt logou, please try again in few seconds!');
            })
        },
        getStatusSync:function(){
            return status;
        },
        checkStatus: function () {
           var deferred = $q.defer();
            FB.getLoginStatus(
                function ( response ) {
                    if(response.status=="connected"){
                        uid = response.authResponse.userID;
                        accessToken =  response.authResponse.accessToken;
                        status='connected';
                        deferred.resolve(response.status);
                    }
                    else{
                        deferred.resolve(false);
                    }
                }
            );
            return deferred.promise;
        },
        getAuthData: function () {
            var deferred = $q.defer();

            FB.getLoginStatus(function (response) {
                if(response.status=="connected"){
                    status = response.status; //private 
                    uid = response.authResponse.userID;
                    accessToken =  response.authResponse.accessToken;
                
                    FB.api('/me',
                    function(data){
                        deferred.resolve(data);
                    });
                }else{
                    deferred.reject();
                }
            });
            
            return deferred.promise;
        },
        getPages: function(){
            var deferred = $q.defer();
            FB.api(
                '/me/home/', {since: since,'limit': limit},
                function ( response ) {

                    if ( response && !response.error ) {
                        var pages = [];
                        for(var i =0;i<response.data.length; i++){
                            if(response.data[i].from.category){
                                pages.push(response.data[i]);
                            }
                        }
                        response.data = pages;
                        deferred.resolve(response);
                    }
                }
            );
            return deferred.promise;
        },
        getFeed: function () {

            var deferred = $q.defer();

            FB.api(
                '/me/home/', {since: since,'limit': limit},
                function (response) {
                    if (response && !response.error) {

                        deferred.resolve(response);
                    }

                }

            );
            return deferred.promise;
        },
        getStatuses: function() {
            var deferred = $q.defer();
            FB.api(
                '/me/home/', {since: since,'limit': limit},
                function ( response ) {

                    if ( response && !response.error ) {

                        var statuses = [];

                        for (var i = 0; i < response.data.length; i++) {
                            if(response.data[i].comments) {

                                if (response.data[i].comments.data[0].can_remove !== undefined) {

                                    if (!response.data[i].from.category) {
                                        statuses.push(response.data[i]);
                                    }
                                }
                            }
                            else if(response.data[i].place) {
                                
                                if (!response.data[i].from.category) {
                                    statuses.push(response.data[i]);
                                }
                            }
                        }
                        response.data = statuses;
                        deferred.resolve(response);
                    }
                }
            );
            return deferred.promise;  
        },
        getPosts: function() {
            var deferred = $q.defer();
            FB.api(
                "/me/home", {since: since,'limit': limit},
                function ( response ) {
                    if ( response && !response.error ) {

                        var posts = [];
                        for(var i = 0; i < response.data.length; i++) {

                            if ((response.data[i].status_type == "mobile_status_update" && response.data[i].type!='photo')
                                || (response.data[i].status_type == 'shared_story' &&
                                        (response.data[i].type == 'video' || response.data[i].type=='link')
                                    )
                                ) {

                                posts.push(response.data[i]);
                            }
                        }
                        response.data = posts;
                        deferred.resolve(response);
                    }
                }
            );
            return deferred.promise;  
        },
        getVideos: function() {
            var deferred = $q.defer(),
                videos = []
            FB.api(
                '/me/home/', {since: since,'limit': limit},
                function ( response ) {

                    if ( response && !response.error ) {

                        for(var i = 0; i < response.data.length; i++) {

                            if(response.data[i].application) {

                                    var type = response.data[i].application.name;
                                    if((type == 'Video' || type == 'YouTube') && (response.data[i].source || response.data[i].link)) {

                                        videos.push(response.data[i]);
                                    }
                            }

                            else if(response.data[i].type == 'video') {

                                videos.push(response.data[i]);
                            }
                        }

                        response.data = videos;
                        deferred.resolve(response);
                    }
                }
            );
            return deferred.promise;  
        },
        getPostById: function (id) {
            var deferred = $q.defer();

            FB.api(
                '/' + id,
                function (response) {
                  if (response && !response.error) {
                    deferred.resolve(response);
                  }
                    else {
                        console.error("Error querying post by id: " + response.error);
                    }
                }
            );
            return deferred.promise;
        },
        getAppID: function(){
            return id;
        },
        getPictureByID: function(id){
            var deferred = $q.defer();
            FB.api(
                "/" + id +  "/picture",
                function (response) {
                    if (response && !response.error) {
                        deferred.resolve(response.data.url);
                    }
                }  
            );
            return deferred.promise;
        },
        getUserNotifications: function () {

            var deferred = $q.defer();
            FB.api(
                "/me/notifications", {'since':'last week','limit': limit},
                function (response) {
                    deferred.resolve(response);
                }  
            );
            return deferred.promise;
        },
        getUserProfilePicture: function(){
            if(userProfilePicture){
                return userProfilePicture
            }else{
                FB.api(
                "/me/picture",
                    function (response) {
                        if (response && !response.error) {
                            userProfilePicture=response.data.url;
                            return response.data.url;
                        }
                    }  
                );
            }
        },
        getMoreFeed: function(URL){
            var deferred = $q.defer();

            FB.api(
                URL, {'since':'last month', 'limit': limit},
                function (response){
                    if(response && !response.error){
                        deferred.resolve(response);
                    }
                }
            );
            return deferred.promise;
        },
        getMorePages: function (URL) {

            var deferred = $q.defer();
            console.log("URL: " + URL);
            FB.api(
                URL, {'since':'last month', 'limit': limit},
                function (response) {
                    
                    if ( response && !response.error ) {
                        var pages = [];
                        for(var i =0;i<response.data.length; i++){
                            if(response.data[i].from.category){
                                pages.push(response.data[i]);
                            }
                        }
                        response.data = pages;
                        deferred.resolve(response);
                    }
                }
            );
            return deferred.promise;
        },
        getMoreVideos: function (URL) {

            var deferred = $q.defer(),
                videos = [];

            FB.api(
                URL, {'since':'last month', 'limit': limit},
                function (response) {
                    
                    if ( response && !response.error ) {

                        for(var i = 0; i < response.data.length; i++) {

                            if(response.data[i].application) {

                                    var type = response.data[i].application.name;
                                    if((type == 'Video' || type == 'YouTube') && (response.data[i].source || response.data[i].link)) {

                                        videos.push(response.data[i]);
                                    }
                            }

                            else if(response.data[i].type == 'video') {

                                videos.push(response.data[i]);
                            }
                        }

                        response.data = videos;
                        deferred.resolve(response);
                    }
                }
            );
            return deferred.promise;

        },
        getMorePosts: function (URL) {

            var deferred = $q.defer();

            FB.api(
                URL, {'since':'last month', 'limit': limit},
                function (response) {
                    
                    if ( response && !response.error ) {

                        var posts = [];
                        for(var i = 0; i < response.data.length; i++) {

                            if ((response.data[i].status_type == "mobile_status_update" && response.data[i].type!='photo')
                                || (response.data[i].status_type == 'shared_story' &&
                                        (response.data[i].type == 'video' || response.data[i].type=='link')
                                    )
                                ) {

                                posts.push(response.data[i]);
                            }
                        }
                        response.data = posts;
                        deferred.resolve(response);
                    }
                }
            );
            return deferred.promise;

        },
        getMoreStatuses: function (URL) {

            var deferred = $q.defer();

            FB.api(
                URL, {'since':'last month', 'limit': limit},
                function (response) {
                    
                    if ( response && !response.error ) {

                        var statuses = [];

                        for (var i = 0; i < response.data.length; i++) {
                            if(response.data[i].comments) {

                                if (response.data[i].comments.data[0].can_remove !== undefined) {

                                    if (!response.data[i].from.category) {
                                        statuses.push(response.data[i]);
                                    }
                                }
                            }
                            else if(response.data[i].place) {
                                
                                if (!response.data[i].from.category) {
                                    statuses.push(response.data[i]);
                                }
                            }
                        }
                        response.data = statuses;
                        deferred.resolve(response);
                    }
                }
            );
            return deferred.promise;

        },
        deleteNotification: function (item) {

            var deferred = $q.defer();

            FB.api(
                'https://graph.facebook.com/' + item, 'post',
                { unread: 0 },
                function(response) {
                    if (!response || response.error) {
                        console.error('------------------------------------------');
                        console.error('Error occured while marking notification as read');
                        console.error(response.error);
                        console.error('------------------------------------------');
                    } else {
                        deferred.resolve(response);
                    }
                });
            return deferred.promise;
        },
        getEventById: function(id){
            var deferred = $q.defer();

            FB.api(
                '/' + id,
                function (response) {
                  if (response && !response.error) {
                    deferred.resolve(response);
                  }
                    else {
                        console.error("Error querying event with id: " + response.error);
                    }
                }
            );
            return deferred.promise;
        },
        postStatusToMyWall: function(messageUser){
            var deferred = $q.defer();
            FB.api(
                '/me/feed',
                "post", { message: messageUser },
                function(response){
                    console.log(response);
                    deferred.resolve(response);
                }
            );

            return deferred.promise;
        }
    }
})