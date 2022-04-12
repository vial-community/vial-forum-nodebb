'use strict';

((module) => {
	const User = require.main.require('./src/user');
	const Groups = require.main.require('./src/groups');
	const db = require.main.require('./src/database');
	const authenticationController = require.main.require('./src/controllers/authentication');
	const Settings = require.main.require('./src/settings');
	const privileges = require.main.require('./src/privileges');


	const async = require('async');
	const { PassportOIDC } = require('./src/passport-fusionauth-oidc');

	const passport = module.parent.require('passport');
	const nconf = module.parent.require('nconf');
	const winston = module.parent.require('winston');

	const constants = {
		name: 'fusionauth-oidc',
		callbackURL: '/auth/fusionauth-oidc/callback',
		pluginSettingsURL: '/admin/plugins/fusionauth-oidc'
	};

	var settings = {
		base_URL: process.env.AUTH_BASE_URL || "",
		clientId: process.env.AUTH_CLIENT_ID || "",
		clientSecret: process.env.AUTH_CLIENT_SECRET || "",
		callbackURL: process.env.AUTH_CALLBACK_URL || "",
		emailClaim: 'email',
		rolesClaim: 'roles',
		authorizationEndpoint: "",
		tokenEndpoint: "",
		userInfoEndpoint: "",
		logoutEndpoint: ""
	};

	const Oidc = {};

	/**
	 * Sets up the router bindings for the settings page
	 * @param params
	 * @param callback
	 */
	Oidc.init = function (params, callback) {
		winston.verbose('[fusion-auth] Setting up FusionAuth OIDC bindings/routes...');

		function render(req, res) {

			var data = {
				base_URL: settings.base_URL,
				authorizationEndpoint: settings.authorizationEndpoint,
				tokenEndpoint: settings.tokenEndpoint,
				userInfoEndpoint: settings.userInfoEndpoint,
				logoutEndpoint: settings.logoutEndpoint,
				clientId: settings.clientId,
				clientSecret: "[hidden]"
			};

			res.render('admin/plugins/fusionauth-oidc', data);
		}

		params.router.get(constants.pluginSettingsURL, params.middleware.admin.buildHeader, render);
		params.router.get('/api/admin/plugins/fusionauth-oidc', render);

		callback();
	};

	/**
	 * Binds the passport strategy to the global passport object
	 * @param strategies The global list of strategies
	 * @param callback
	 */
	Oidc.bindStrategy = function (strategies, callback) {

		winston.verbose('[fusion-auth] Setting up FusionAuth...');

		callback = callback || function () {
		};

		//constants.pluginSettings.sync(function (err) {
		try {

			const base_URL = settings.base_URL;

			if (base_URL) {

				/*const errorFunc = () => {
					winston.info('[fusion-auth] Timeout occured while trying to retrieve FusionAuth settings!');
					return callback();
				};

				const timeout = setTimeout(errorFunc, 5000);

				fetch(base_URL + '/.well-known/openid-configuration/71dfc9f5-b817-e024-6f00-b08c6e4d4dbd') //ZAN
					.then((res) => res.json())
					.then((json) => {
						clearTimeout(timeout);
						settings.authorizationEndpoint = json.authorization_endpoint;
						settings.tokenEndpoint = json.token_endpoint;
						settings.userInfoEndpoint = json.userinfo_endpoint;
						settings.logoutEndpoint = json.end_session_endpoint;
					})
					.catch((e) => {
						clearTimeout(timeout);
						console.error(e);
						winston.info('[fusion-auth] Error occured while trying to retrieve FusionAuth settings!');
						return callback();
					});
				*/

				const oauth2_path = '/oauth2/';
				settings.authorizationEndpoint = base_URL + oauth2_path + 'authorize';
				settings.tokenEndpoint = base_URL + oauth2_path + 'token';
				settings.userInfoEndpoint = base_URL + oauth2_path + 'userinfo';
				settings.logoutEndpoint = base_URL + oauth2_path + 'logout';

			} else {
				winston.info('[fusion-auth] FusionAuth Base_URL is not set!');
				return callback();
			}

			// If we are missing any settings
			if (!settings.clientId ||
				!settings.clientSecret ||
				!settings.authorizationEndpoint ||
				!settings.tokenEndpoint ||
				!settings.userInfoEndpoint ||
				!settings.logoutEndpoint ||
				!settings.callbackURL) {
				winston.info('[fusion-auth] Missing FusionAuth condiguration!');
				return callback();
			}

			// If you call this twice it will overwrite the first.
			passport.use(constants.name, new PassportOIDC(settings, (req, accessToken, refreshToken, profile, callback) => {

				const email = profile[settings.emailClaim || 'email'];
				const isAdmin = settings.rolesClaim ? (profile[settings.rolesClaim] === 'administrators' || (profile[settings.rolesClaim].some && profile[settings.rolesClaim].some((value) => value === 'administrators'))) : false;

				Oidc.login({
					oAuthid: profile.sub,
					//username: email.split('@')[0],//profile.preferred_username || email.split('@')[0],
					username: profile.preferred_username || email.split('@')[0],
					email: email,
					rolesEnabled: settings.rolesClaim && settings.rolesClaim.length !== 0,
					isAdmin: isAdmin
				}, (err, user) => {
					if (err) {
						return callback(err);
					}

					authenticationController.onSuccessfulLogin(req, user.uid);
					callback(null, user);
				});
			}));

			// If we are doing the update, strategies won't be the right object so
			if (strategies.push) {
				strategies.push({
					name: constants.name,
					url: '/auth/' + constants.name,
					callbackURL: '/auth/' + constants.name + '/callback',
					icon: 'fa-openid',
					scope: ['roles', 'openid', settings.emailClaim],
				});
			}
			callback(null, strategies);
		} catch (err) {
			callback(err);
		}
	};


	Oidc.login = function (payload, callback) {
		async.waterfall([
			// Lookup user by existing oauthid
			(callback) => Oidc.getUidByOAuthid(payload.oAuthid, callback),
			// Skip if we found the user in the pevious step or create the user
			function (uid, callback) {
				if (uid !== null) {
					//existing user:
					callback(null, uid);
				} else {
					// New User
					if (!payload.email) {
						return callback(new Error('[fusion-auth] The email was missing from the user, we cannot log them in.'));
					}
					async.waterfall([
						(callback) => User.getUidByEmail(payload.email, callback),
						function (uid, callback) {
							if (!uid) {
								User.create({
									username: payload.username,
									email: payload.email,
								}, callback);
							} else {
								callback(null, uid); // Existing account -- merge
							}
						},
						function (uid, callback) {
							// Save provider-specific information to the user
							User.setUserField(uid, constants.name + 'Id', payload.oAuthid);
							db.setObjectField(constants.name + 'Id:uid', payload.oAuthid, uid);

							callback(null, uid);
						},
					], callback);
				}
			},
			// Get the users membership status to admins
			(uid, callback) => Groups.isMember(uid, 'administrators', (err, isMember) => {
				callback(err, uid, isMember);
			}),
			// If the plugin is configured to use roles, add or remove them from the admin group (if necessary)
			(uid, isMember, callback) => {
				if (payload.rolesEnabled) {
					if (payload.isAdmin === true && !isMember) {
						Groups.join('administrators', uid, (err) => {
							callback(err, uid);
						});
					} else if (payload.isAdmin === false && isMember) {
						Groups.leave('administrators', uid, (err) => {
							callback(err, uid);
						});
					} else {
						// Continue
						callback(null, uid);
					}
				} else {
					// Continue
					callback(null, uid);
				}
			},
		], function (err, uid) {
			if (err) {
				return callback(err);
			}
			callback(null, {
				uid: uid,
			});
		});
	};


	Oidc.getUidByOAuthid = function (oAuthid, callback) {
		db.getObjectField(constants.name + 'Id:uid', oAuthid, (err, uid) => {
			if (err) {
				return callback(err);
			}
			callback(null, uid);
		});
	};

	Oidc.deleteUserData = function (data, callback) {
		async.waterfall([
			async.apply(User.getUserField, data.uid, constants.name + 'Id'),
			(oAuthIdToDelete, next) => {
				db.deleteObjectField(constants.name + 'Id:uid', oAuthIdToDelete, next);
			},
		], (err) => {
			if (err) {
				winston.error('[fusion-auth] Could not remove OAuthId data for uid ' + data.uid + '. Error: ' + err);
				return callback(err);
			}

			callback(null, data);
		});
	};

	// If this filter is not there, the deleteUserData function will fail when getting the oauthId for deletion.
	Oidc.whitelistFields = function (params, callback) {
		params.whitelist.push(constants.name + 'Id');
		callback(null, params);
	};

	Oidc.bindMenuOption = function (header, callback) {
		winston.verbose('Binding menu option');
		header.authentication.push({
			route: constants.pluginSettingsURL.replace('/admin', ''), // They will add the /admin for us
			name: 'FusionAuth',
		});

		callback(null, header);
	};

	Oidc.redirectLogout = function (payload, callback) {
		//const settings = constants.pluginSettings.getWrapper();

		if (settings.logoutEndpoint) {
			winston.verbose('Changing logout to OpenID logout');
			let separator;
			if (settings.logoutEndpoint.indexOf('?') === -1) {
				separator = '?';
			} else {
				separator = '&';
			}
			payload.next = settings.logoutEndpoint + separator + 'client_id=' + settings.clientId;
		}

		return callback(null, payload);
	};

	module.exports = Oidc;
})(module);
