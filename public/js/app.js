$(document).foundation()


USER_ID = -1;
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

							//load playlist information
							document.getElementById('get-playlists').click()
							$('#loggedin').show();
						}
				});
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
					addSongListener(access_token);
				})
			}, false);
		}
})();

function addSongListener(access_token) {
	//get playlist songs
	$(".get-songs").each(function() {
		var playlist = this;
		playlist.addEventListener('click', function() {
			$.ajax({
					url: '/get_songs',
					data: {
						'access_token': access_token,
						'user_id': USER_ID,
						'playlist_id': this.id
					}
			}).done(function(data) {
				console.log(data);
			}, false);
		});
	});
}