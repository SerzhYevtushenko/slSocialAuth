//for vk auth need to include <script src="http://vk.com/js/api/openapi.js" type="text/javascript"></script>
//for facebook auth need to include <script src="http://connect.facebook.net/ru_RU/all.js?5#xfbml=1"></script>
"use strict";

var SocialAuth = (function () {

    function SocialAuth() {
        this.groupLikeFlag      = false;
        this.groupLikeStatus    = false;
        this.loginStatus        = false;
        this.redirectUri        = window.location.protocol+'//'+window.location.hostname;

        this.vk           = {
            appId:      null,
            fields:     'uid,first_name,last_name,photo_100,email'
        };

        this.fb           = {
            appID:        null,
            scope:        null,
            fields:       'id,name,first_name,last_name,link,email,picture.width(131).height(131)'
        };
    }

    SocialAuth.prototype.initFacebook = function(config) {
        this.configure(config, 'fb');
        try{
            FB.init({appId: this.fb.appID, status: true, cookie: true, xfbml: true});
        }catch(e) {
            alert(e);
        }
    }

    SocialAuth.prototype.initVK = function(config) {
        this.configure(config, 'vk');
        try{
            VK.init({apiId: this.vk.appId});
        } catch (e) {
            alert(e);
        }
    }

    SocialAuth.prototype.configure = function(config, socialKey) {
        for(var i in config) {
            if (this[socialKey][i] !== undefined) {
                this[socialKey][i] = config[i];
            } else {
                // error
            }
        }
    }

    SocialAuth.prototype.facebookLogin = function() {
        FB.login(this.facebookGetUserInfo.bind(this), {scope: this._fbScope})
    }

    SocialAuth.prototype.facebookGetUserInfo = function() {
        FB.getLoginStatus(function(UserInfoResponse) {
            if (UserInfoResponse.status === 'connected') {
                FB.api('/me?fields='+this._fbFields, function(userInfo) {
                    socialAuth.saveUserInfo({user: userInfo, auth_response: UserInfoResponse.authResponse, social_key: 'fb'});
                });
            }
        });
    }

    SocialAuth.prototype.vkLogin = function() {
        VK.Auth.login(this.vkGetUserInfo.bind(this));
    }

    SocialAuth.prototype.vkGetUserInfo = function(UserInfoResponse) {
        if (UserInfoResponse.session) {
            VK.Api.call('users.get', {uids: UserInfoResponse.mid, fields: this.vk.fields}, function(userInfo){
                socialAuth.saveUserInfo({user: userInfo.response[0], auth_response: UserInfoResponse, social_key: 'vk'})
            });
        }
    }

    SocialAuth.prototype.saveUserInfo = function(data) {
        $.post('social/social-login-acl/', data, function(result) {
//          check group like
            if (socialAuth.groupLikeFlag) {
                socialAuth.redirect();
            } else {
                socialAuth.showLikePopup();
            }
        });
    }

    SocialAuth.prototype.showLikePopup = function() {
//        show popup
    }

    SocialAuth.prototype.likeGroup  = function() {
        this.groupLikeStatus = true;
        this.redirect();
    }

    SocialAuth.prototype.unlikeGroup = function() {
        this.groupLikeStatus = false;
    }

    SocialAuth.prototype.redirect = function() {
        window.location.href = this.redirectUri;
    }

    SocialAuth.prototype.facebookPostOnWall = function(link, title, description, picture, to,caption) {
        var obj = {
            method:         'feed',
            link:           link,
            name:           title,
            description:    description,
            picture:        picture,
            to:             to
        };

        if(undefined != caption){
            obj.caption = caption;
        }

        FB.ui(obj, function(result){
            if((undefined != result) && (undefined != result.post_id)){
//            success
            }else{
//            error
            }
        });

    }

    SocialAuth.prototype.vkPostOnWall = function(owner_id, message, attachments) {
        var data = {
            owner_id:   owner_id,
            message:    message,
            attachments: attachments
        };

        VK.Api.call('wall.post',data,
            function(result){
                if(undefined != result.response){
//                success
                }else{
//                error
                }
            }
        );
    }

    SocialAuth.prototype.sharePopup = function(social_key, purl, ptitle, pimg, text) {
        var url = '';
        if ('vk' == social_key){
            purl+= '?utm_source=vkontakte&utm_medium=share&utm_campaign=FoodTigra';
            url  = 'http://vkontakte.ru/share.php?';
            url += 'url='          + encodeURIComponent(purl);
            url += '&title='       + encodeURIComponent(ptitle);
            url += '&description=' + encodeURIComponent(text);
            url += '&image='       + encodeURIComponent(pimg);
            url += '&noparse=true';
        } else if('od' == social_key){
            url  = 'http://www.odnoklassniki.ru/dk?st.cmd=addShare&st.s=1';
            url  = 'http://www.odnoklassniki.ru/dk?st.cmd=addShare&st.s=2&st.noresize=on';
            url += '&st.comments=' + encodeURIComponent(text);
            url += '&st._surl='    + encodeURIComponent(purl);
        } else if('fb' == social_key){
            _trackEvent('share', 'fb');
            purl+= '?utm_source=facebook&utm_medium=share&utm_campaign=FoodTigra';
            url  = 'http://www.facebook.com/sharer.php?s=100';
            url += '&p[title]='     + encodeURIComponent(ptitle);
            url += '&p[summary]='   + encodeURIComponent(text);
            url += '&p[url]='       + encodeURIComponent(purl);
            url += '&p[images][0]=' + encodeURIComponent(pimg);
        } else if('tw' == social_key){
            _trackEvent('share', 'tw');
            purl+= '?utm_source=twitter&utm_medium=share&utm_campaign=FoodTigra';
            url  = 'http://twitter.com/share?';
            url += 'text='      + encodeURIComponent(ptitle);
            url += '&url='      + encodeURIComponent(purl);
            url += '&counturl=' + encodeURIComponent(purl);
        }

        var width = ($(window).width()-650)/2;
        var height = ($(window).height()-400)/2;
        window.open(url, social_key, 'width=650,height=400,left='+width+',top='+height+';');
    }

    return SocialAuth;
})();

window.socialAuth = new SocialAuth();


$(document).ready(function() {
    try{
        FB.Event.subscribe('edge.create',function(){
            socialAuth.likeGroup();
        });
        FB.Event.subscribe('edge.remove',function(){
            socialAuth.unlikeGroup();
        });
    }catch (e) {
//      FB is not defined
//      call socialAuth.initFacebook() function
    }

    try{
        VK.Observer.subscribe('widgets.subscribed',function(){
            socialAuth.likeGroup();
        });
        VK.Observer.subscribe('widgets.unsubscribed',function(){
            socialAuth.unlikeGroup();
        });
    } catch (e) {
//        VK is not defined
//        call socialAuth.initVK() function
    }


});