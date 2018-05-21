$(document).foundation()

USER_ID = -1;
current_song_id = null;
(function() {

		/**
		 * Obtains parameters from the hash of the URL
		 * @return Object
		 */
		function getHashParams() {
			var hashParams = {};
			var e, r = /([^&;=]+)=?([^&;]*)/g,
			q = window.location.hash.substring(1);
			while ( e = r.exec(q)) {
				hashParams[e[1]] = decodeURIComponent(e[2]);
			}
			return hashParams;
		}

		var userProfileSource = document.getElementById('user-profile-template').innerHTML,
		userProfileTemplate = Handlebars.compile(userProfileSource),
		userProfilePlaceholder = document.getElementById('user-profile');

		var oauthSource = document.getElementById('oauth-template').innerHTML,
		oauthTemplate = Handlebars.compile(oauthSource),
		oauthPlaceholder = document.getElementById('oauth');

		//playlist 
		var playlistSource = document.getElementById("playlist-template").innerHTML,
		playlistTemplate = Handlebars.compile(playlistSource),
		playlistPlaceholder = document.getElementById("playlist-left-nav");
	
		var params = getHashParams();

		var access_token = params.access_token,
		refresh_token = params.refresh_token,
		error = params.error;

		if (error) {
			alert('There was an error during the authentication');
		} else {
			if (access_token) {
				/* render oauth info
				oauthPlaceholder.innerHTML = oauthTemplate({
						access_token: access_token,
						refresh_token: refresh_token
				});
				*/

				$.ajax({
						url: 'https://api.spotify.com/v1/me',
						headers: {
							'Authorization': 'Bearer ' + access_token
						},
						success: function(response) {
							//userProfilePlaceholder.innerHTML = userProfileTemplate(response);
							USER_ID = response.id;

							$('#login').hide();
							$('#loggedin').show();

							//load playlist information
							document.getElementById('get-playlists').click()	
						}
				});
				//initialize web player
				//var player = initializeWebPlayer(access_token);
			} else {
				// render initial screen
				$('#login').show();
				$('#loggedin').hide();
			}

			document.getElementById('obtain-new-token').addEventListener('click', function() {
				$.ajax({
						url: '/refresh_token',
						data: {
							'refresh_token': refresh_token
						}
				}).done(function(data) {
				access_token = data.access_token;
				oauthPlaceholder.innerHTML = oauthTemplate({
						access_token: access_token,
						refresh_token: refresh_token
				});
				});
			}, false);

			//list playlists
			document.getElementById('get-playlists').addEventListener('click', function() {
				$.ajax({
						url: '/get_playlists',
						data: {
							'access_token': access_token,
							'user_id': USER_ID
						}
				}).done(function(data) {
					playlistPlaceholder.innerHTML = playlistTemplate(data);

					//check if any playlists are currently playing
					checkCurrentPlayback(access_token);

					//add listeners to the songs
					addPlaylistListener(access_token);
				})
			}, false);
		}
})();

function addPlaylistListener(access_token) {
	//get playlist songs
	$(".get-songs").each(function() {
		//song 
		var songSource = document.getElementById("songlist-template").innerHTML,
		songTemplate = Handlebars.compile(songSource),
		songPlaceholder = document.getElementById("songlist");

		var playlist = this;
		playlist.addEventListener('click', function() {
			//remove class selected and then add to clicked
			$(".selected").removeClass("selected");
			this.className += " selected";

			//remove old songs
			var s = document.getElementById("songlist");
			while (s.firstChild) {
				s.removeChild(s.firstChild);
			}

			$.ajax({
					url: '/get_songs',
					data: {
						'access_token': access_token,
						'user_id': USER_ID,
						'playlist_id': this.id
					}
			}).done(function(data) {
			songPlaceholder.innerHTML = songTemplate(data);
			addPlayListener(access_token);
			}, false);
		});
	});
}

function addPlayListener(access_token) {
	//get playlist songs
	$(".play-song").each(function() {
		var song = this;
		song.addEventListener('click', function() {
			var song_uri = "spotify:track:" + this.id;

			fetch('https://api.spotify.com/v1/me/player/play', {
					method: 'PUT',
					body: JSON.stringify({ uris: [song_uri] }),
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${access_token}`
					},
			});

			play({
					playerInstance: new Spotify.Player({ name: "uh?" }),
					spotify_uri: song_uri,
			});
		});
	});
}

function initializeWebPlayer(access_token) {
	//initialize web player
	window.onSpotifyWebPlaybackSDKReady = () => {
		const player = new Spotify.Player({
				name: 'Thingy',
				getOAuthToken: cb => { cb(access_token); }
		});

		// Error handling
		player.addListener('initialization_error', ({ message }) => { console.error(message); });
		player.addListener('authentication_error', ({ message }) => { console.error(message); });
		player.addListener('account_error', ({ message }) => { console.error(message); });
		player.addListener('playback_error', ({ message }) => { console.error(message); });

		// Playback status updates
		player.addListener('player_state_changed', state => { console.log(state); });

		// Ready
		player.addListener('ready', ({ device_id }) => {
			console.log('Ready with Device ID', device_id);
		});

		// Not Ready
		player.addListener('not_ready', ({ device_id }) => {
			console.log('Device ID has gone offline', device_id);
		});

		// Connect to the player!
		player.connect();
	}
}

function checkCurrentPlayback(access_token) {	
	$.ajax({
			url: '/check_playback',
			data: {
				'access_token': access_token
			}
	}).done(function(data) {
		if (data.is_playing && data.playlist_id != null) {
			$(".playing").removeClass("playing"); //remove all
			document.getElementById(data.playlist_id).className += " playing"; //add class
		}
		if (data.is_playing) {
			current_song_id = data.song_id;	
		}
	}, false);
}
