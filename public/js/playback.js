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
