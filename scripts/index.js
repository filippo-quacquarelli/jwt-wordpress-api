// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkID=397704
// To debug code on page load in Ripple or on Android devices/emulators: launch your app, set breakpoints, 
// and then run "window.location.reload()" in the JavaScript Console.
(function () {
    "use strict";

    document.addEventListener('deviceready', onDeviceReady.bind(this), false);

    var token = window.localStorage.getItem("token");

    function getToken(domain, username, password) {
        
        $.ajax({
            async: false,
            url: domain + '/wp-json/jwt-auth/v1/token',
            data: {
                username: username,
                password: password
            },
            type: 'POST',
            success: function (data) {
                window.localStorage.setItem("token", data.token);

                token = window.localStorage.getItem("token");

                onDeviceReady();
            },
            error: function (data) {
                appNotification(data.responseJSON.message, true);
            }
        });

        return token;
    }

    function getForm(form) {
        form.on("submit", function (event) {
            event.preventDefault();

            var domain,
                username,
                password;

            var elemForm = $(this).serializeArray();
            var elemFormToObject = $.extend({}, elemForm);

            for (var prop in elemFormToObject) {
                if (elemFormToObject[prop].name == 'domain')    domain   = elemFormToObject[prop].value;
                if (elemFormToObject[prop].name == 'username')  username = elemFormToObject[prop].value;
                if (elemFormToObject[prop].name == 'password')  password = elemFormToObject[prop].value;
            }
               
            if (domain && username && password) {
                getToken(domain, username, password);
            } else {
                appNotification("Riempi tutti i campi");
            }
        });
    }

    function renderPost(token, getPost) {
        $.ajax({
            url: 'http://www.kessydish.com/wprest/wp-json/wp/v2/posts',
            beforeSend: function (request) {
                request.setRequestHeader('Authorization', 'Bearer ' + token);
            },
            type: 'GET',
            success: function (data) {
                getPost.empty();

                for (var i = 0; i < data.length; i++) {
                    getPost.append('<div id="' + data[i].id + '" class="containerPost">' +
                        '<div class="containerPostData">' +
                            '<h1 class="title">' + data[i].title.rendered + '</h1>' +
                            '<div class="content">' + data[i].content.rendered + '</div>' +
                        '</div>' +
                        '<button class="updatePost btn-default">Aggiorna <i class="fa fa-pencil" aria-hidden="true"></i></button>' +
                        '<button class="deletePost btn-default btn-negative">Cancella <i class="fa fa-trash" aria-hidden="true"></i></button>' +
                    '</div>');
                }

                deletePost(token, $(".deletePost"));
                updatePost(token, $(".updatePost"));
            }
        });
    }

    function insertPost(token, form) {
        form.on("submit", function (event) {
            event.preventDefault();

            var elemForm = $(this).serializeArray();
            var elemFormToObject = $.extend({}, elemForm);

            for (var prop in elemFormToObject) {
                if (elemFormToObject[prop].name == 'title') var title = elemFormToObject[prop].value;
                if (elemFormToObject[prop].name == 'content') var content = elemFormToObject[prop].value;
            }

            var jsonData = {
                title: title,
                status: 'publish'
            }

            if (content) {
                jsonData.content = content;
            }

            $.ajax({
                url: 'http://www.kessydish.com/wprest/wp-json/wp/v2/posts',
                beforeSend: function (request) {
                    request.setRequestHeader('Authorization', 'Bearer ' + token);
                },
                type: 'POST',
                data: jsonData,
                success: function (data) {
                    renderPost(token, $("#getPost"));
                }
            });
        });
    }

    function deletePost(token, button) {
        button.click(function (e) {
            e.preventDefault();

            var id = $(this).parent().attr('id');

            $.ajax({
                url: 'http://www.kessydish.com/wprest/wp-json/wp/v2/posts/'+id,
                beforeSend: function (request) {
                    request.setRequestHeader('Authorization', 'Bearer ' + token);
                },
                type: 'DELETE',
                success: function () {
                    renderPost(token, $("#getPost"));
                }
            });
        });
    }

    function updatePost(token, button) {
        button.click(function (e) {
            e.preventDefault();

            var id = $(this).parent().attr('id');
            var objectId = $('#' + id);
            var objNewData = {};

            objectId.find('.containerPostData').hide();
            objectId.find('.btn-default').hide();
            
            objectId.append('<input type="text" name="updateTitle" placeholder="titolo" class="updateTitle">');
            objectId.append('<textarea name="updateContent" class="updateContent"></textarea>');

            objectId.append('<button class="savePost btn-default btn-positive">Salva <i class="fa fa-pencil" aria-hidden="true"></i></button>');
            objectId.append('<button class="resetOperation btn-default">Annulla <i class="fa fa-refresh" aria-hidden="true"></i></button>');

            $('.savePost').click(function (e) {
                e.preventDefault();

                var newTitle = $('.updateTitle').val();
                var newContent = $('.updateContent').val();

                if (newTitle) objNewData.title = newTitle;
                if (newContent) objNewData.content = newContent;

                if (newTitle || newContent) {
                    
                    $.ajax({
                        url: 'http://www.kessydish.com/wprest/wp-json/wp/v2/posts/' + id,
                        beforeSend: function (request) {
                            request.setRequestHeader('Authorization', 'Bearer ' + token);
                        },
                        type: 'POST',
                        data: objNewData,
                        success: function () {
                            renderPost(token, $("#getPost"));
                        }
                    });

                } else {
                    appNotification('Riempi almeno uno dei due campi o annulla l\'operazione');
                }
                
            });

            $('.resetOperation').click(function (e) {
                e.preventDefault();

                renderPost(token, $("#getPost"));
            });
        });
    }

    function appNotification(message, disableLink) {
        
        var appNotification = $('#app-notification');

        appNotification.addClass('visible').append(message);

        appNotification.find('.remove-notification').click(function (e) {
            e.preventDefault();

            appNotification.removeClass('visible');
            appNotification.empty().append('<i class="fa fa-times remove-notification" aria-hidden="true"></i>');
        });

        if (disableLink) {
            appNotification.find('a').click(function (e) {
                e.preventDefault();
            });
        }
    }

    function onDeviceReady() {
        // Handle the Cordova pause and resume events
        document.addEventListener( 'pause', onPause.bind( this ), false );
        document.addEventListener( 'resume', onResume.bind(this), false );

        getForm($('#auth'));

        if (token) {
            $('.form-getToken').hide();
            renderPost(token, $("#getPost"));
            insertPost(token, $("#wpInsertPost"));
        }

        $('#logout').click(function (e) {
            window.localStorage.clear();
            window.location.reload();
        });

        $('#titleNewPost').click(function (e) {
            e.preventDefault();

            if ($(this).parent().is(".top")) {
                $(this).parent().removeClass('top');
            } else {
                $(this).parent().addClass('top');
            }
        });
    };

    function onPause() {
        // TODO: This application has been suspended. Save application state here.
    };

    function onResume() {
        // TODO: This application has been reactivated. Restore application state here.
    };
} )();