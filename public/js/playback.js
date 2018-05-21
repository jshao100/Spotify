function playNext() {
	fetch('https://api.spotify.com/v1/me/player/next', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${ACCESS_TOKEN}`
			},
	});
}

function playPrevious() {
	fetch('https://api.spotify.com/v1/me/player/previous', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${ACCESS_TOKEN}`
			},
	});
}

function playPause() {
	$.ajax({
			url: '/check_playback',
			data: {
				'access_token': ACCESS_TOKEN,
				'type': 'pause'
			}
	}).done(function(data) {
		var url = 'https://api.spotify.com/v1/me/player/play';
		if (data.is_playing) { //call pause
			url = 'https://api.spotify.com/v1/me/player/pause';	
		}

		fetch(url, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${ACCESS_TOKEN}`
			},
		});
	});
}

function playSeek(fwd) {
	$.ajax({
			url: '/check_playback',
			data: {
				'access_token': ACCESS_TOKEN,
				'type': 'seek'
			}
	}).done(function(data) {
		if (data.is_playing) {
			var new_ms = data.progress_ms;
			if (fwd) {
				new_ms += 30000;	
			} else {
				new_ms -= 30000;
			}

			fetch('https://api.spotify.com/v1/me/player/seek?position_ms=' + new_ms, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${ACCESS_TOKEN}`
				},
			});
		} else {
			return;
		}
	})
}

function vote(type) {
	//get current song
	$.ajax({
			url: '/check_playback',
			data: {
				'access_token': ACCESS_TOKEN,
				'type': 'vote'
			}
	}).done(function(data) {
		if (data.is_playing) { //get current song
			moveSong(data.song_id, type);
		}
	});
}

function moveSong(song_id, approve) {
	//get + playlist
	var move_to = $(".bad-playlist").attr("id");
	if (approve) {
		move_to = $(".good-playlist").attr("id");
	}

	//get current playlist
	var current_playlist = $(".selected").attr("id");

	//if not the same, remove from current playlist and add to + playlist
	if (move_to != current_playlist) {
		var song_uri = {
			"uri": "spotify:track:" + song_id
		}
		//remove from current
		var url = "https://api.spotify.com/v1/users/" + USER_ID + 
			"/playlists/" + current_playlist + "/tracks";

		fetch(url, {
			method: 'DELETE',
			body: JSON.stringify({ tracks: [song_uri] }),
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${ACCESS_TOKEN}`
			},
		});
		playNext();
		$("#"+song_id).parents("tr").remove();

		//add to target playlist
		url = "https://api.spotify.com/v1/users/" + USER_ID + 
			"/playlists/" + move_to + "/tracks";
		fetch(url, {
			method: 'POST',
			body: JSON.stringify({ uris: ["spotify:track:" + song_id] }),
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${ACCESS_TOKEN}`
			},
		});
	}
}
