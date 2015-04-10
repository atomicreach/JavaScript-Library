/*
Name: api_client
Version: 1.3.0
Author: BOC
*/
function arClient() {
    var client = {};
    var consumerConfiguration =
    {
        consumerKey: ""
        , consumerSecret: ""
        , serviceProvider: {
        signatureMethod: "HMAC-SHA1"
        , host: ""
        , requestTokenURL: "/oauth/request-token"
        , userAuthorizationURL: "/oauth/authorize"
        , accessTokenURL: "/oauth/access-token"
        , echoURL: "/api/echo"
        , analyzeURL: "/post/analyze"
        , postAddURL: "/post/add"
        , addSourceURL: "/source/add"
        , getAudienceListURL: "/source/get-audience-list"
        , trackWordpressDataURL: "/wordpress/track-data"
        , addDictionaryURL: "/dictionary/add"
        , removeDictionaryURL: "/dictionary/remove"
        , listDictionariesURL: "/dictionary/list"
        , getTokens: "/api/get-tokens"
        , createAccount: "/account/create"
        , addWebsite: "/source/add"
        , addSocialNetwork: "/account/add-social-network"
        , getSocialNetworks: "/account/get-social-networks"
        , removeNetwork: "/account/remove-account"
        , listSources: "/source/list"
        , getMostEngagedSegment: "/engagement/get-most-engaged-segment"
        , getAtomicScore: "/account/get-atomic-score"
        , webProfiles: "/engagement/web-profiles"
        , gaProfiles: "/account/ga-profiles"
        , updateSource: "/source/update"
    }
    };
    var keys;
    var request_resp;
    var interval = 1500;
    var oauth_token;
    var oauth_token_secret;

    var statusConstants = {
        STATUS_OK: 10,
        STATUS_INTERNAL_ERROR: 20,
        STATUS_INVALID_ACCESS_TOKEN: 21,
        STATUS_THRESHOLD_EXCEEDED: 22,
        STATUS_INVALID_ACTION: 23,
        STATUS_INVALID_DATA: 24
    };

    function getRequestToken(c, callback) {
        return doRequest({
                method: 'GET'
                , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.requestTokenURL
                , parameters: {
                    oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                    , oauth_consumer_key: consumerConfiguration.consumerKey
                }
            }
            , {
                consumerSecret: consumerConfiguration.consumerSecret
                , tokenSecret: ''
            }
            , callback
        );
    };

    function getAuthorize(c, oauth_token, callback) {
        var URL = consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.userAuthorizationURL;
        $.ajax({
            url: URL,
            method: "GET",
            data: {"oauth_token": oauth_token, "oauth_callback": ""},
            "success": function () {
                callback();
            }
        });
    }

    function getAccessToken(c, token, secret, callback) {
        return doRequest({
                method: 'GET'
                , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.accessTokenURL
                , parameters: {
                    oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                    , oauth_consumer_key: consumerConfiguration.consumerKey
                    , oauth_token: token
                }
            }
            , {
                consumerSecret: consumerConfiguration.consumerSecret
                , tokenSecret: secret
            }
            , callback
        );

    };

    function doRequest(message, accessor, callback) {
        if (typeof accessor.consumerSecret != 'undefined') {
            OAuth.setTimestampAndNonce(message);
            OAuth.SignatureMethod.sign(message, accessor);
        }
        var method = message.method;
        var URL = message.action;
        var params = {};
        var r = null;

        json_data = message.parameters

        $.ajax({
            url: URL,
            method: method,
            data: json_data,
            "success": function (result) {
                //console.log("OK: ", result);
                if (typeof callback == 'function') {
                    callback(result);
                }
            },
            "error": function (result) {
                //console.error("!!!!!!ERROR!!!!!!!!!:", result);
                if (typeof callback == 'function') {
                    callback(result);
                }

            },
            "async": true
        })
    }

    function getTokens(username, password, googleId) {
        doRequest({
                method: 'POST'
                , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.getTokens
                , parameters: {
                    'username': username
                    , 'password': md5(password)
                    , 'google_id': googleId
                }
            }
            , {}
            , function (value) {
                if (value.status != 10) {
                    onError(value);
                } else {
                    console.log(value.data);
                    keys = value.data;
                    setOauth(keys.consumer_key, keys.consumer_secret);
                }
            }
        );
    }

    client.verifyGoogleId = function (googleId) {
        //getTokens("","",googleId);

        doRequest({
                method: 'POST'
                , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.getTokens
                , parameters: {
                    'username': ''
                    , 'password': ''
                    , 'google_id': googleId
                }
            }
            , {}
            , function (value) {
                if (value.status != 10) {
                    onError_g(value);
                } else {
                    console.log(value.data);
                    keys = value.data;
                    setOauth(keys.consumer_key, keys.consumer_secret);
                }
            }
        );


    }

    client.init = function (apiHost, consumerKey, consumerSecret, onSuccess, onError, username, password) {
        oauth_token = "BOOTING";
        consumerConfiguration.serviceProvider.host = apiHost;
        if (typeof username !== 'undefined') {
            getTokens(username, password);
        } else {
            setOauth(consumerKey, consumerSecret);
        }
    }

    function setOauth(consumerKey, consumerSecret) {
        consumerConfiguration.consumerKey = consumerKey;
        consumerConfiguration.consumerSecret = consumerSecret;
        c = consumerConfiguration;
        getRequestToken(c, function (aux) {
            if (typeof aux.responseText != "undefined" && typeof aux.responseText !== undefined) {
                onError(aux);
            }
            else {
                request_resp = getJsonFromUrl(aux);
                getAuthorize(c, request_resp.oauth_token,
                    function () {
                        getAccessToken(c, request_resp.oauth_token, request_resp.oauth_token_secret,
                            function (aux2) {
                                access_resp = getJsonFromUrl(aux2);
                                /////////////////////////////////////////
                                oauth_token = access_resp.oauth_token;
                                oauth_token_secret = access_resp.oauth_token_secret;
                                onSuccess()
                            });
                    }
                );
            }
        });
    }

    client.getEcho = function (msg, callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.echoURL
                        , parameters: {
                            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                            , echo: encodeURIComponent(msg)
                        }
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    }

    client.addPost = function (text, teaser, sourceId, segmentId, title, pubDate, url, callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.postAddURL
                        , parameters: {
                            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                            , text: encodeURIComponent(text)
                            , teaser: encodeURIComponent(teaser)
                            , sourceId: encodeURIComponent(sourceId)
                            , segmentId: encodeURIComponent(segmentId)
                            , title: encodeURIComponent(title)
                            , pubDate: encodeURIComponent(pubDate)
                            , url: encodeURIComponent(url)
                        }
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    }

    client.analyzePost = function (content, title, sophisticationBandId, callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.analyzeURL
                        , parameters: {
                            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                            , content: encodeURIComponent(content)
                            , title: encodeURIComponent(title)
                            , sophisticationBandId: encodeURIComponent(sophisticationBandId)
                        }
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    }

    client.addSource = function (title, segmentDataJson, callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.addSourceURL
                        , parameters: {
                            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                            , title: encodeURIComponent(title)
                            , segmentDataJson: encodeURIComponent(segmentDataJson)
                        }
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    }
    client.updateSource = function(sourceId, options, callback) {
        		var tokenCheck = setInterval(function() {
            			if(tokenReady()) {
                				clearInterval(tokenCheck);

                    				return doRequest( { method: 'POST'
                						, action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.updateSource
                						, parameters: $.extend({}
                                        , options
                                        , { oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                							, oauth_consumer_key: consumerConfiguration.consumerKey
                							, oauth_token: oauth_token
                							, sourceId: encodeURIComponent(sourceId)
                						})
                					}
                					, { consumerSecret: consumerConfiguration.consumerSecret
                						, tokenSecret   : oauth_token_secret
                					}
                					, callback
                				);
                			}
            		}, interval);
        	}


    client.getAudienceList = function (callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.getAudienceListURL
                        , parameters: {
                            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                        }
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    }

    client.trackWordpressData = function (data, callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.trackWordpressDataURL
                        , parameters: {
                            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                            , data: data
                        }
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    }

    client.addDictionary = function (word, callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.addDictionaryURL
                        , parameters: {
                            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                            , word: encodeURIComponent(word)
                        }
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    }

    client.removeDictionary = function (word, callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.removeDictionaryURL
                        , parameters: {
                            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                            , word: encodeURIComponent(word)
                        }
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    }

    client.listDictionaries = function (callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.listDictionariesURL
                        , parameters: {
                            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                            , data: encodeURIComponent("")
                        }
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    }

    client.setApiHost = function (apiHost) {
        action: consumerConfiguration.serviceProvider.host = apiHost;
    }

    client.getOauthTokens = function () {
        return {
            consumerKey: consumerConfiguration.consumerKey,
            consumerSecret: consumerConfiguration.consumerSecret
        };
    }

    client.createAccount = function (email, password, receive_newsletters, receive_product_updates, google_id, callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.createAccount
                        , parameters: {
                            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                            , email: email
                            , password: password
                            , receive_newsletters: typeof receive_newsletters == 'undefined' ? 0 : 1
                            , receive_product_updates: typeof receive_product_updates == 'undefined' ? 0 : 1
                            , google_id: typeof google_id == 'undefined' ? null : google_id
                            , data: encodeURIComponent("")
                        }
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                    //}else{
                    //, callback
                    //}

                );
            }
        }, interval);

    }
    client.addWebsite = function (url, sophisticationBandId, articleSelector, titleSelector, contentSelector, options, callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);

                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.addWebsite
                        , parameters: $.extend({}, options, {
                            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                            , url: encodeURIComponent(url)
                            , sophisticationBandId: encodeURIComponent(sophisticationBandId)
                            , articleSelector: encodeURIComponent(articleSelector)
                            , titleSelector: encodeURIComponent(titleSelector)
                            , contentSelector: encodeURIComponent(contentSelector)
                        })
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    }

    client.listSources = function (callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.listSources
                        , parameters: {
                            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                            , data: encodeURIComponent("")
                        }
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    }

    client.getMostEngagedSegment = function (callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.getMostEngagedSegment
                        , parameters: {
                            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                            , data: encodeURIComponent("")
                        }
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    }

    client.webProfiles = function (callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.webProfiles
                        , parameters: {
                            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                            , data: encodeURIComponent("")
                        }
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    }


    client.getAtomicScore = function (callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.getAtomicScore
                        , parameters: {
                            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                            , data: encodeURIComponent("")
                        }
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    }
    client.getSocialNetworks = function (callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.getSocialNetworks
                        , parameters: {
                            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                        }
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    }
    client.gaProfiles = function (callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                //alert(consumerConfiguration.serviceProvider.gaProfiles);
                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.gaProfiles
                        , parameters: {
                            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                            , data: encodeURIComponent("")
                        }
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    }

    client.addSocialNetwork = function (network_code, callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.addSocialNetwork
                        , parameters: {
                            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                            , networkCode: network_code
                            , data: encodeURIComponent("")
                        }
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , function (value) {
                        console.log(value);
                        var myWindow = window.open(value.login, "auth", "width=500, height=500");
                    }
                );
            }
        }, interval);
    }

    client.removeNetwork = function (username, code, callback) {
        var tokenCheck = setInterval(function () {
            if (tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest({
                        method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.removeNetwork
                        , parameters: {
                            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                            , userName: encodeURIComponent(username)
                            , networkCode: encodeURIComponent(code)
                            , data: encodeURIComponent("")
                        }
                    }
                    , {
                        consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret: oauth_token_secret
                    }
                    , callback);
            }
        }, interval);

    }

    function tokenReady() {
        if (oauth_token != "BOOTING" && oauth_token != "") r = true
        else r = false;

        return r;
    }

    function getJsonFromUrl(query) {
        var data = query.split("&");
        var result = {};
        for (var i = 0; i < data.length; i++) {
            var item = data[i].split("=");
            result[item[0]] = item[1];
        }
        return result;
    }

    return client;
}