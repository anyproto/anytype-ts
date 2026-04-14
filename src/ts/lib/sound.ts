
interface SoundItem {
	id: string;
	name: string;
	path: string;
};

export const SYSTEM_SOUND_ID = 'system';

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
		if (!sound || (sound == SYSTEM_SOUND_ID)) {
			return;
		};

		this.play(sound);
	};

	isSystem (): boolean {
		return S.Common.notificationSound == SYSTEM_SOUND_ID;
	};

};

export default new Sound();
