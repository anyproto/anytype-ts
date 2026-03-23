import { S } from 'Lib';

interface SoundItem {
	id: string;
	name: string;
	path: string;
};

const SOUNDS: SoundItem[] = [
	{ id: 'bongo', name: 'Bongo', path: './audio/bongo.mp3' },
	{ id: 'clave', name: 'Clave', path: './audio/clave.mp3' },
	{ id: 'chimes', name: 'Chimes', path: './audio/chimes.mp3' },
];

let audio: HTMLAudioElement = null;

class Sound {

	list = SOUNDS;

	play (id: string) {
		const item = SOUNDS.find(it => it.id == id);
		if (!item) {
			return;
		};

		try {
			if (audio) {
				audio.pause();
				audio.currentTime = 0;
			};

			audio = new Audio(item.path);
			audio.play().catch(() => {});
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
