//requires
var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var rp = require('request-promise');
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
require('dotenv').config()

//global env variables
console.log("Loading client id and secret from .env");
var client_id = process.env.CLIENT_ID;
var client_secret = process.env.CLIENT_SECRET;
var redirect_uri = 'http://localhost:8888/callback/'; // Your redirect uri


/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
	var text = '';
	var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

	for (var i = 0; i < length; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
.use(cors())
.use(cookieParser());

app.get('/login', function(req, res) {

	var state = generateRandomString(16);
	res.cookie(stateKey, state);

	// your application requests authorization
	var scope = 'user-read-private user-read-email ' +
		'playlist-read-collaborative playlist-read-private'; //allow to read playlist information
	res.redirect('https://accounts.spotify.com/authorize?' +
			querystring.stringify({
					response_type: 'code',
					client_id: client_id,
					scope: scope,
					redirect_uri: redirect_uri,
					state: state
	}));
});

app.get('/callback', function(req, res) {

	// your application requests refresh and access tokens
	// after checking the state parameter

	var code = req.query.code || null;
	var state = req.query.state || null;
	var storedState = req.cookies ? req.cookies[stateKey] : null;

	if (state === null || state !== storedState) {
		res.redirect('/#' +
				querystring.stringify({
						error: 'state_mismatch'
		}));
	} else {
		res.clearCookie(stateKey);
		var authOptions = {
			url: 'https://accounts.spotify.com/api/token',
			form: {
				code: code,
				redirect_uri: redirect_uri,
				grant_type: 'authorization_code'
			},
			headers: {
				'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
			},
			json: true
		};

		request.post(authOptions, function(error, response, body) {
			if (!error && response.statusCode === 200) {

				var access_token = body.access_token,
				refresh_token = body.refresh_token;

				var options = {
					url: 'https://api.spotify.com/v1/me',
					headers: { 'Authorization': 'Bearer ' + access_token },
					json: true
				};

				// use the access token to access the Spotify Web API
				request.get(options, function(error, response, body) {
					console.log(body);
				});

				// we can also pass the token to the browser to make requests from there
				res.redirect('/#' +
						querystring.stringify({
								access_token: access_token,
								refresh_token: refresh_token
				}));
			} else {
				res.redirect('/#' +
						querystring.stringify({
								error: 'invalid_token'
				}));
			}
		});
	}
});

app.get('/refresh_token', function(req, res) {
	// requesting access token from refresh token
	var refresh_token = req.query.refresh_token;
	var authOptions = {
		url: 'https://accounts.spotify.com/api/token',
		headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
		form: {
			grant_type: 'refresh_token',
			refresh_token: refresh_token
		},
		json: true
	};

	request.post(authOptions, function(error, response, body) {
		if (!error && response.statusCode === 200) {
			var access_token = body.access_token;
			res.send({
					'access_token': access_token
			});
		}
	});
});

app.get('/get_playlists', function(req, res) {
	console.log("/get_playlists");

	var access_token = req.query.access_token;
	var user_id = req.query.user_id;

	var options = {
		url: 'https://api.spotify.com/v1/me/playlists',
		headers: { 'Authorization': 'Bearer ' + access_token },
		json: true
	};

	// use the access token to access the Spotify Web API
	request.get(options, function(error, response, body) {
		if (!error && response.statusCode == 200) {
			var playlist_array = [];
			for (var i = 0; i < body.total; i++) {
				var playlist = body.items[i];
				if (playlist.owner.id == user_id) {
					var playlist_info = {
						"name": body.items[i].name,
						"id": body.items[i].id
					};
					playlist_array.push(playlist_info);
				}
			}
			var playlist_json = {
				"playlist": playlist_array
			};

			res.send(playlist_json);
		} else {
			console.log(error);
			console.log(response.statusCode);
		}
	});
});

app.get('/get_songs', function(req, res) {
	console.log("/get_songs?playlist_id=" + req.query.playlist_id);

	var access_token = req.query.access_token;
	var user_id = req.query.user_id;
	var playlist_id = req.query.playlist_id;
	var api_url = 'https://api.spotify.com/v1/users/' + user_id + 
		'/playlists/' + playlist_id + 
		'/tracks?fields=limit,previous,next,total,items(track(name,id,artists(name)))&offset=0';

	getSongs(api_url, access_token, function(result) {
		console.log("complete");	
	});
});

function getSongs(link, access_token, callback) {
	var song_list = [];
	var options = {
		url: link,
		headers: { 'Authorization': 'Bearer ' + access_token },
		json: true,
		async: false
	};
	var next = null;

	rp(options)
	.then(function(body) {
		var count = 100;
		if (body.next == null) {
			count = body.total % 100;
		} else {
			next = body.next;
		}

		//parse body
		for (var i = 0; i < count; i++) {
			var track_info = body.items[i];

			var song_name = track_info.track.name;
			var song_id = track_info.track.id;
			var song_artist = ""; 
			var artist_info = track_info.track.artists;
			for (var j = 0; j < artist_info.length; j++) {
				song_artist += artist_info[j].name + ", ";
			}
			song_artist = song_artist.substring(0, song_artist.length - 2);

			var song_info = {
				"name": song_name,
				"id": song_id,
				"artist": song_artist
			};
			song_list.push(song_info);
		}
		console.log(song_list.length);
		if (body.next != null) {
			getSongs(body.next, access_token, callback);
		} else {
			callback();
		}
	})
	.catch(function(err) {
		console.log(err);
	});
}

console.log('Listening on 8888');
app.listen(8888);
