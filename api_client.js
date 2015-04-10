function arClient()
{
    var client = {};
    var consumerConfiguration =
    {
        consumerKey   : ""
        , consumerSecret: ""
        , serviceProvider:
    { signatureMethod        : "HMAC-SHA1"
        , host                   : ""
        , requestTokenURL        : "/oauth/request-token"
        , userAuthorizationURL   : "/oauth/authorize"
        , accessTokenURL         : "/oauth/access-token"
        , echoURL                : "/api/echo"
        , analyzeURL             : "/post/analyze"
        , postAddURL             : "/post/add"
        , getPosts               : "/posts"
        , addSourceURL           : "/source/add"
	    , addWebsite             : "/source/add"
        , getAudienceListURL     : "/source/get-audience-list"
        , trackWordpressDataURL  : "/wordpress/track-data"
        , addDictionaryURL       : "/dictionary/add"
        , removeDictionaryURL    : "/dictionary/remove"
        , listDictionariesURL    : "/dictionary/list"
        , getTokens				 : "/api/get-tokens"
        , createAccount			 : "/account/create"
        , addSocialNetwork       : "/account/add-social-network"
        , getSocialNetworks      : "/account/get-social-networks"
        , removeNetwork          : "/account/remove-account"
        , listSources			 : "/source/list"
        , getMostEngagedSegment  : "/engagement/get-most-engaged-segment"
        , getAtomicScore		 : "/account/get-atomic-score"
	    , webProfiles            : "/engagement/web-profiles"
	    , gaProfiles             : "/account/ga-profiles"
        , updateSource           : "/source/update"
        , updateSource           : "/source/update"
        , getAudience            : "/audience"
        , getInsightsEngagament  : "/insights/engagement"
        , getInsightsMeasures    : "/insights/measures"
    }
    };
    var keys;
    var request_resp;
    var interval = 1500;
    var oauth_token;
    var oauth_token_secret;

    var statusConstants = {
        STATUS_OK : 10,
        STATUS_INTERNAL_ERROR : 20,
        STATUS_INVALID_ACCESS_TOKEN : 21,
        STATUS_THRESHOLD_EXCEEDED : 22,
        STATUS_INVALID_ACTION : 23,
        STATUS_INVALID_DATA : 24,
    };


    client.getInsightsMeasures = function(options, callback) {
        var tokenCheck = setInterval(function() {
            if(tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest( { method: 'GET'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.getInsightsMeasures
                        , parameters: buildOauthParameter(options)
                    }
                    , { consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret   : oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    }

    client.getInsightsEngagament = function(options, callback) {
        var tokenCheck = setInterval(function() {
            if(tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest( { method: 'GET'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.getInsightsEngagament
                        , parameters: buildOauthParameter(options)
                    }
                    , { consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret   : oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    }

    client.getAudience = function(options, callback) {
        var tokenCheck = setInterval(function() {
            if(tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest( { method: 'GET'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.getAudience
                        , parameters: buildOauthParameter(options)
                    }
                    , { consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret   : oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    }


    function getRequestToken(c, callback) {
        return doRequest( { method: 'GET'
                , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.requestTokenURL
                , parameters: { oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                    , oauth_consumer_key: consumerConfiguration.consumerKey
                }
            }
            , { consumerSecret: consumerConfiguration.consumerSecret
                , tokenSecret   : ''
            }
            , callback
        );
    };

    function getAuthorize(c, oauth_token, callback){
        var URL = consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.userAuthorizationURL;
        $.ajax({
            url: URL,
            method: "GET",
            data: {"oauth_token" : oauth_token, "oauth_callback" : ""},
            "success": function() {
                callback();
            }
        });
    }

    function getAccessToken(c, token, secret, callback) {
        return  doRequest( { method: 'GET'
                , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.accessTokenURL
                , parameters: { oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                    , oauth_consumer_key: consumerConfiguration.consumerKey
                    , oauth_token: token
                }
            }
            , { consumerSecret: consumerConfiguration.consumerSecret
                , tokenSecret   : secret
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
            "success": function(result) {
                //console.log("OK: ", result);
                if (typeof callback == 'function') { callback(result);}
            },
            "error": function(result) {
                //console.error("!!!!!!ERROR!!!!!!!!!:", result);
                if (typeof callback == 'function') { callback(result);}

            },
            "async": true
        })
    }

    function getTokens( username, password, googleId) {
        doRequest( { method: 'POST'
                , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.getTokens
                , parameters: { 'username': username
                    , 'password':  md5(password)
                    , 'google_id':  googleId
                }
            }
            , { }
            , function(value) {
                if (value.status != 10 ) {
                    onError(value);
                } else  {
                    console.log(value.data);
                   keys = value.data;
                    setOauth(keys.consumer_key, keys.consumer_secret);
                }
            }
        );
    }

    function buildOauthParameter(options)
    {
        var ret = { 
            oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod,
            oauth_consumer_key: consumerConfiguration.consumerKey,
            oauth_token: oauth_token,
            data: encodeURIComponent("")
        };
        for (var property in options)
        {
            if (!property in ret)
                ret[property] = options[property];
        }
        return ret;
    }

    client.verifyGoogleId = function(googleId) {
    	getTokens("","",googleId);
    }
    
    client.init = function(apiHost, consumerKey, consumerSecret, onSuccess, onError, username, password){
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
        getRequestToken(c, function(aux){
            if (typeof aux.responseText != "undefined" && typeof aux.responseText !== undefined)
            {
                onError(aux);
            }
            else
            {
                request_resp = getJsonFromUrl(aux);
                getAuthorize(c, request_resp.oauth_token,
                    function(){
                        getAccessToken(c, request_resp.oauth_token, request_resp.oauth_token_secret,
                            function(aux2){
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

    client.addNewUser = function(email, password, newsletter, prodUpdates){


    }



    client.getEcho = function(msg, callback) {
        var tokenCheck = setInterval(function() {
            if(tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest( { method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.echoURL
                        , parameters: { oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                            , echo: encodeURIComponent(msg)
                        }
                    }
                    , { consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret   : oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    }


    client.getSocialNetworks = function(callback) {
        var tokenCheck = setInterval(function() {
            if(tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest( { method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.getSocialNetworks
                        , parameters: buildOauthParameter({})
                    }
                    , { consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret   : oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    }


    client.addSocialNetwork= function() {
        var tokenCheck = setInterval(function() {
           if(tokenReady()) {
            clearInterval(tokenCheck);
            return doRequest( { method: 'POST'
                       , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.addSocialNetowrk
                       , parameters: { oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                                     , oauth_consumer_key: consumerConfiguration.consumerKey
                                     , oauth_token: oauth_token
                       , data: encodeURIComponent("")
                       }
                       }
                     , { consumerSecret: consumerConfiguration.consumerSecret
                       , tokenSecret   : oauth_token_secret
                       }
                       , function(value) { 
                           console.log(value);
                           var myWindow = window.open(value.login, "auth", "width=500, height=500");
                           }
            );
          }
        }, interval); 
            
      }


    client.removeNetwork = function(client, username, code) {
        var tokenCheck = setInterval(function() {
           if(tokenReady()) {
            clearInterval(tokenCheck);
            return doRequest( { method: 'POST'
                       , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.removeNetwork
                       , parameters: { oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                                     , oauth_consumer_key: consumerConfiguration.consumerKey
                                     , oauth_token:  oauth_token
                                     , userName: username
                                     , networkCode: code
                       , data: encodeURIComponent("")
                       }
                       }
                     , { consumerSecret: consumerConfiguration.consumerSecret
                       , tokenSecret   : oauth_token_secret
                       }
                       , function(value) { 
                           console.log(value);
                       });
        }}, interval);

    }


    client.addPost = function(text, teaser, sourceId, segmentId, title, pubDate, url, callback) {
        var tokenCheck = setInterval(function() {
            if(tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest( { method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.postAddURL
                        , parameters: { oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
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
                    , { consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret   : oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    }

    client.analyzePost = function(content, title , sophisticationBandId, callback) {
        var tokenCheck = setInterval(function() {
            if(tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest( { method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.analyzeURL
                        , parameters: { oauth_signature_method: consumerConfiguration.serviceProvider.signatureMethod
                            , oauth_consumer_key: consumerConfiguration.consumerKey
                            , oauth_token: oauth_token
                            , content: encodeURIComponent(content)
                            , title: encodeURIComponent(title)
                            , sophisticationBandId: encodeURIComponent(sophisticationBandId)
                        }
                    }
                    , { consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret   : oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    }

    client.addSource = function(title, segmentDataJson, callback) {
        var tokenCheck = setInterval(function() {
            if(tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest( { method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.addSourceURL
                        , parameters: buildOauthParameter({
                            title: encodeURIComponent(title)
                            , segmentDataJson: encodeURIComponent(segmentDataJson)})
                    }
                    , { consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret   : oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    }

	client.addWebsite = function(url, sophisticationBandId, articleSelector, titleSelector, contentSelector, options) {
		var tokenCheck = setInterval(function() {
			if(tokenReady()) {
				clearInterval(tokenCheck);

				return doRequest( { method: 'POST'
						, action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.addWebsite
                        , parameters: buildOauthParameter({
                            url: encodeURIComponent(url)
                            , sophisticationBandId: encodeURIComponent(sophisticationBandId)
                            , articleSelector: encodeURIComponent(articleSelector)
                            , titleSelector: encodeURIComponent(titleSelector)
                            , contentSelector: encodeURIComponent(contentSelector)})
					}
					, { consumerSecret: consumerConfiguration.consumerSecret
						, tokenSecret   : oauth_token_secret
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
                        , parameters: buildOauthParameter({sourceId: encodeURIComponent(sourceId)})
					}
					, { consumerSecret: consumerConfiguration.consumerSecret
						, tokenSecret   : oauth_token_secret
					}
					, callback
				);
			}
		}, interval);
	}

    client.getAudienceList = function(callback){
        var tokenCheck = setInterval(function() {
            if(tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest( { method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.getAudienceListURL
                        , parameters: buildOauthParameter({})
                    }
                    , { consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret   : oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    }

    client.trackWordpressData = function(data, callback) {
        var tokenCheck = setInterval(function() {
            if(tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest( { method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.trackWordpressDataURL
                        , parameters: buildOauthParameter({data: data})
                    }
                    , { consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret   : oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    }

    client.addDictionary = function(word, callback) {
        var tokenCheck = setInterval(function() {
            if(tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest( { method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.addDictionaryURL
                        , parameters: buildOauthParameter({word: encodeURIComponent(word)})
                    }
                    , { consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret   : oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    }

    client.removeDictionary = function(word, callback) {
        var tokenCheck = setInterval(function() {
            if(tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest( { method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.removeDictionaryURL
                        , parameters: buildOauthParameter({word: encodeURIComponent(word)})
                    }
                    , { consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret   : oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    }

    client.listDictionaries = function(callback) {
        var tokenCheck = setInterval(function() {
            if(tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest( { method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.listDictionariesURL
                        , parameters: buildOauthParameter({})
                    }
                    , { consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret   : oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    }

    client.setApiHost=function(apiHost) {
        action: consumerConfiguration.serviceProvider.host = apiHost;
    }

    client.getOauthTokens=function() {
        return {consumerKey: consumerConfiguration.consumerKey,
            consumerSecret:consumerConfiguration.consumerSecret};
    }

    client.createAccount= function(email, password, callback, receive_newsletters, receive_product_updates, google_id) {
    	var tokenCheck = setInterval(function() {
           if(tokenReady()) {
            clearInterval(tokenCheck);
            return doRequest( { method: 'POST'
                       , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.createAccount
                       , parameters: buildOauthParameter({
                                     email: email
                                     , password: password
                                     , receive_newsletters: typeof receive_newsletters == 'undefined' ? 0 : 1
                                     , receive_product_updates: typeof receive_product_updates == 'undefined' ? 0 :1
                                     , google_id: typeof google_id == 'undefined' ? null : google_id
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

    client.listSources = function(callback) {
        var tokenCheck = setInterval(function() {
            if(tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest( { method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.listSources
                        , parameters: buildOauthParameter({})
                    }
                    , { consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret   : oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    }

    client.getMostEngagedSegment = function(options,callback) {
        var tokenCheck = setInterval(function() {
            if(tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest( { method: 'GET'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.getMostEngagedSegment
                        , parameters: buildOauthParameter(options)
                    }
                    , { consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret   : oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    }

    client.getPosts = function(options, callback) {
        var tokenCheck = setInterval(function() {
            if(tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest( { method: 'GET'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.getPosts
                        , parameters: buildOauthParameter(options)
                    }
                    , { consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret   : oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    }


	client.webProfiles = function(callback) {
		var tokenCheck = setInterval(function() {
			if(tokenReady()) {
				clearInterval(tokenCheck);
				return doRequest( { method: 'POST'
						, action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.webProfiles
						, parameters: buildOauthParameter({})
					}
					, { consumerSecret: consumerConfiguration.consumerSecret
						, tokenSecret   : oauth_token_secret
					}
					, callback
				);
			}
		}, interval);
	}

	client.gaProfiles = function(callback) {
		var tokenCheck = setInterval(function() {
			if(tokenReady()) {
				clearInterval(tokenCheck);
				return doRequest( { method: 'POST'
						, action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.gaProfiles
						, parameters: buildOauthParameter({})
					}
					, { consumerSecret: consumerConfiguration.consumerSecret
						, tokenSecret   : oauth_token_secret
					}
					, callback
				);
			}
		}, interval);
	}
    
    client.getAtomicScore = function(callback) {
        var tokenCheck = setInterval(function() {
            if(tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest( { method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.getAtomicScore
                        , parameters: buildOauthParameter({})
                    }
                    , { consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret   : oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    }

    client.getInsightsEngagement = function(options, callback) {
        var tokenCheck = setInterval(function() {
            if(tokenReady()) {
                clearInterval(tokenCheck);
                return doRequest( { method: 'POST'
                        , action: consumerConfiguration.serviceProvider.host + consumerConfiguration.serviceProvider.getInsightsEngagament
                        , parameters: buildOauthParameter(options)
                    }
                    , { consumerSecret: consumerConfiguration.consumerSecret
                        , tokenSecret   : oauth_token_secret
                    }
                    , callback
                );
            }
        }, interval);
    }

    function tokenReady(){
        if(oauth_token!="BOOTING" && oauth_token!="") r = true
        else r = false;

        return r;
    }

    function getJsonFromUrl(query) {
        var data = query.split("&");
        var result = {};
        for(var i=0; i<data.length; i++) {
            var item = data[i].split("=");
            result[item[0]] = item[1];
        }
        return result;
    }
    return client;
}