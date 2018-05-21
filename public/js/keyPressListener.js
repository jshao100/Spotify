/*recognize keypress
 *
 * playback commands
 * c = next track
 * x = pause track
 * z = previous track 
 * SHIFT + c = seek + 30 seconds
 * SHIFT + z = seek - 30 seconds
 *
 * vote on song
 * a = approve and go to next
 * d = decline and go to next
 * s = skip and go to next
 *
 */

var C = 67,
X = 88,
Z = 90,
SHIFT = 16,
A = 65,
D = 68,
S = 83;

var keys = {};

window.onkeydown = function (e) {
	keys[e.which] = true;

	//next track, seek +30s
	if (keys[C]) {
		if (keys[SHIFT]) {
			playSeek(true);
		} else {
			playNext();
		}
	}
	//pause
	else if (keys[X]) {
		playPause();
	}
	//previous, seek -30s
	else if (keys[Z]) {
		if (keys[SHIFT]) {
			playSeek(false);
		} else {
			playPrevious();	
		}
	}
	//approve
	else if (keys[A]) {

	}
	//skip
	else if (keys[S]) {
		playNext();
	}
	//decline
	else if (keys[D]) {

	}
};

window.onkeyup = function (e) {
	delete keys[e.which];
};

