"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var OAuth2Strategy = require("passport-oauth2");
var PassportOIDC = /** @class */ (function (_super) {
    __extends(PassportOIDC, _super);
    function PassportOIDC(settings, verifyFunction) {
        var _this = _super.call(this, {
            clientID: settings.clientId,
            clientSecret: settings.clientSecret,
            callbackURL: settings.callbackURL,
            authorizationURL: settings.authorizationEndpoint,
            tokenURL: settings.tokenEndpoint,
            scope: ['roles', 'groups', 'openid', settings.emailClaim],
            passReqToCallback: true
        }, verifyFunction) || this;
        _this.settings = settings;
        _this.name = "passport-oidc";
        return _this;
    }
    // Just to remember these exist
    // tokenParams(options: any): object {
    // 	return super.tokenParams(options);
    // }
    // Just to remember these exist
    // authorizationParams(options: any): object {
    // 	return super.authorizationParams(options);
    // }
    PassportOIDC.prototype.userProfile = function (accessToken, done) {
        if (!accessToken) {
            done(new Error('Missing token, cannot call the userinfo endpoint without it.'));
        }
        this._oauth2.useAuthorizationHeaderforGET(true);
        this._oauth2.get(this.settings.userInfoEndpoint, accessToken, function (err, body, res) {
            if (err) {
                console.error(err);
                return done(new Error("Failed to get user info. Exception was previously logged."));
            }
            if (res.statusCode > 299 || res.statusCode < 200) {
                return done(new Error("Unexpected response from userInfo. [" + res.statusCode + "] [" + body + "]"));
            }
            try {
                done(null, JSON.parse(body));
            }
            catch (e) {
                console.error(e);
                done(new Error("Failed to parse the userinfo body. Exception was previously logged."));
            }
        });
    };
    return PassportOIDC;
}(OAuth2Strategy));
exports.PassportOIDC = PassportOIDC;
exports["default"] = PassportOIDC;
