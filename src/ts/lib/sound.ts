import { S } from 'Lib';

const SOUNDS = {
	bongo: './audio/bongo.mp3',
	clave: './audio/clave.mp3',
	chimes: './audio/chimes.mp3',
};

let audio: HTMLAudioElement = null;

class Sound {

	play (id: string) {
		const path = SOUNDS[id];
		if (!path) {
			return;
		};

		try {
			if (audio) {
				audio.pause();
				audio.currentTime = 0;
			};

			audio = new Audio(path);
			audio.play();
		} catch (e) {
			console.error('[Sound.play]', e);
		};
	};

	playNotification () {
		const sound = S.Common.notificationSound;
		if (!sound) {
			return;
		};

		this.play(sound);
	};

};

export default new Sound();
