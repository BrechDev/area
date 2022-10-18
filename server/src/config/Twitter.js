const OAuth2 = require('passport-oauth2');
const util = require('util');

function Strategy (options, verify) {
    options = {
        ...options,
        authorizationURL: 'https://twitter.com/i/oauth2/authorize',
        tokenURL: 'https://api.twitter.com/2/oauth2/token',
        sessionKey: 'oauth:twitter',
        pkce: true,
        state: true,
        clientType: 'public',
        customHeaders: {
            Authorization: 'Basic ' + Buffer.from(`${options.clientID}:${options.clientSecret}`).toString( 'base64' )
        }
    };
    OAuth2.call(this, options, verify);
    this.name = "twitter";
    this.options = options;
    this.profileUrl = "https://api.twitter.com/2/users/me";
}

util.inherits(Strategy, OAuth2);

Strategy.prototype.authenticate = function (req, options) {
    OAuth2.prototype.authenticate.call(this, req, options);
};

Strategy.prototype.authorizationParams = function (options) {
    return (options);
};

Strategy.prototype.tokenParams = function (options) {
    return (options);
};

Strategy.prototype.userProfile = function(accessToken, done) {
    var json;

    var url = new URL(this.profileUrl);
    url.query = url.query || {};

    this._oauth2.useAuthorizationHeaderforGET(true);
    this._oauth2.get(url.toString(), accessToken, function (err, body, res) {
      if (err) {
        if (err.data) {
          try {
            json = JSON.parse(err.data);
          } catch (_) {
            return done(new InternalOAuthError('Failed to fetch user profile', err));
          }
        }
        if (json && json.errors && json.errors.length) {
          var e = json.errors[0];
          return done(new Error(e.message, e.code));
        }
        return done(new InternalOAuthError('Failed to fetch user profile', err));
      }
      try {
        json = JSON.parse(body);
      } catch (ex) {
        return done(new Error('Failed to parse user profile'));
      }
      var profile = {};
      profile.id = String(json.data.id);
      profile.username = json.data.username;
      profile.displayName = json.data.name;
      profile.profileUrl = json.data.url;
      if (json.data.profile_image_url)
        profile.photos = [{ value: json.data.profile_image_url }];
      profile.provider = 'twitter';
      profile._raw = body;
      profile._json = json.data;
      /*this._oauth2.get(new URL(this.infoProfileUrl), accessToken, function (err, body, res) {
        if (err) {
          if (err.data) {
            try {
              json = JSON.parse(err.data);
            } catch (_) {
              return done(new InternalOAuthError('Failed to fetch user profile', err));
            }
          }
          if (json && json.errors && json.errors.length) {
            var e = json.errors[0];
            return done(new Error(e.message, e.code));
          }
          return done(new InternalOAuthError('Failed to fetch user profile', err));
        }
        try {
          json = JSON.parse(body);
        } catch (ex) {
          return done(new Error('Failed to parse user profile'));
        }
        console.log(json);*/
        done(null, profile);
      //});      
    });
};

module.exports = Strategy;
