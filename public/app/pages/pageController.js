﻿app.controller( 'PagesController', function ( $scope, Identity, Auth, UserResource, 
    $modal, $log, $rootScope, $sce, FacebookService, 
    ButtonsFacebookService, EmbedService, PopupService ) {

    $scope.stillLoding = true;
    var idComment, idFrom;

    FacebookService.getAuthData()
        .then( function ( data ) {
            $rootScope.user = data;
        });

    FacebookService.getPages().then( function ( response ) {

        var data = response.data;
        console.log(data[0]);

        $scope.pageImages = [];
        $scope.pages = data;

        for ( var z = 0; z < $scope.pages.length; z++ ) {

            if ( $scope.pages[z].application ) {

                var type = $scope.pages[z].application.name;
                if ( type == 'Video' || type == 'YouTube' ) {

                    $scope.pages[z] = EmbedService.normalizeLink( $scope.pages[z] );
                }
            }

            else if ( $scope.pages[z].type == 'video' ) {

                $scope.pages[z] = EmbedService.normalizeLink( $scope.pages[z] );
            }
        }


        var pages = [];
        for ( var i = 0; i < data.length; i++ ) {
            if ( data[i] ) {
                pages.push( data[i] );
            }
        }
        data = pages;
        $scope.pages = data;

        var k = 0;
        function profileImageLoop() {

            if ( data[k] ) {
                FacebookService.getPictureByID( data[k].from.id )
                    .then( function ( url ) {
                        $scope.pages[k++].profileImage = url;
                        if ( k < data.length ) {
                            setTimeout( profileImageLoop, 1 );
                        }
                    });

            }
        }
        if(data.length != 0){
            profileImageLoop();
        }

        for ( var t = 0; t < data.length; t++ ) {
            if ( data[t] && data[t].type == "photo" ) {

                $scope.pages[t].postPhoto = "https://graph.facebook.com/" + data[t].object_id + "/picture";
            }
        }

        $scope.stillLoding = false;
        console.log( data );

        $scope.trustSrc = function ( src ) {
            return $sce.trustAsResourceUrl( src );
        }

        for ( var z = 0; z < data.length; z++ ) {

            if ( data[z] && data[z].application ) {

                var type = data[z].application.name;
                if ( type == 'Video' || type == 'YouTube' ) {

                    $scope.pages[z] = EmbedService.normalizeLink( data[z] );
                }
            }

            else if ( data[z] && $scope.pages[z].type == 'video' ) {

                $scope.pages[z] = EmbedService.normalizeLink( $scope.pages[z] );
            }
        }

        $scope.nextPage = function () {

            $scope.busy = true;
            var nextPage = response.paging.next;

            FacebookService.getMorePages(nextPage).then(function (pagingResponse) {

                response.paging = pagingResponse.paging;
                k = $scope.pages.length;

                for ( var i = 0; i < pagingResponse.data.length; i++ ) {
                    if ( pagingResponse.data[i] ) {
                        $scope.pages.push( pagingResponse.data[i] );
                    }
                }

                if(pagingResponse.data.length != 0){
                    for(;k<$scope.pages.length;k++){
                            $scope.pages[k].profileImage = "https://graph.facebook.com/" + 
                                $scope.pages[k].from.id + "/picture";
                    }
                }

                $scope.busy = false;

            })
        }

        $scope.share = function ( item ) {

            if ( item.shares ) {
                item.shares.count = item.shares.count + 1;
            }
            ButtonsFacebookService.share( item ).then(function(success){
                if(success){
                    Auth.update(Identity.currentUser, item.from.id).then(function(success){
                        console.log('Successfully Updated User!');
                    });
                }
                else{
                    //do smth P.S. remove alerts in buttonsFacebook like/comment/share
                }
            });;
        }

        $scope.like = function ( item ) {
            ButtonsFacebookService.like( item ).then(function(success){
                if(success){
                    Auth.update(Identity.currentUser, item.from.id).then(function(success){
                        console.log('Successfully Updated User!');
                    });
                }
                else{
                    //do smth P.S. remove alerts in buttonsFacebook like/comment/share
                }
            });
        }

        $scope.commentWindow = function ( page ) {
            
            $scope.pages[page].wantToComment = true;
            $scope.pages[page].showComments = true;
            idComment = data[page].id;
            idFrom = $scope.pages[page].from.id;
        }
        $scope.comment = function ( commentInput ) {
            var itemToComment = {};
            itemToComment.id = idComment;
            itemToComment.userMessage = commentInput.message
            ButtonsFacebookService.comment( itemToComment ).then(function(success){
                if(success){
                    Auth.update(Identity.currentUser, idFrom).then(function(success){
                        console.log('Successfully Updated User!');
                    });
                }
                else{
                    //do smth P.S. remove alerts in buttonsFacebook like/comment/share
                }
            });
            $( '.comment-input' ).val( '' );
        }
        $scope.profilePicture = FacebookService.getUserProfilePicture();

        setTimeout( PopupService.init, 600 );

        if (response.data.length <= 4) {

            $scope.nextPage();
        }
    });
    
    $scope.modalShown = false;
    
    $scope.toggleModal = function () {
        $scope.modalShown = !$scope.modalShown;
    };

    $scope.showComments = function (page) {
        console.log('showing');
        $scope.pages[page].showComments = true;
        $scope.pages[page].wantToComment = true;
        console.log($scope.pages[page]);
    }

});