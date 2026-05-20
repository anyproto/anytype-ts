import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef, MouseEvent } from 'react';
import raf from 'raf';
import { Icon, DragHorizontal, DragVertical, Label } from 'Component';

interface PlaylistItem {
	name: string;
	src: string;
};

interface Props {
	playlist: PlaylistItem[];
	getScrollContainer?(): any;
	onPlay?(): void;
	onPause?(): void;
};

interface MediaAudioRefProps {
	updatePlaylist(playlist: PlaylistItem[]): void;
	onPlay?(): void;
	onPause?(): void;
};

const MediaAudio = forwardRef<MediaAudioRefProps, Props>(({
	playlist = [],
	onPlay,
	onPause,
	getScrollContainer,
}, ref) => {

	const nodeRef = useRef<HTMLDivElement>(null);
	const audioRef = useRef<HTMLAudioElement>(null);
	const timeRef = useRef(null);
	const timeTextRef = useRef(null);
	const volumeIconRef = useRef(null);
	const volumeRef = useRef(null);
	const timeoutRef = useRef(0);
	const frameRef = useRef(0);
	const [ current, setCurrent ] = useState<PlaylistItem>(null);
	const [ playingState, setPlayingState ] = useState(false);
	const [ mutedState, setMutedState ] = useState(false);
	const { src, name }	= current || {};

	const isPlaying = useRef(false);
	const volume = useRef(1);
	const isMuted = useRef(false);
	const playOnSeek = useRef(false);

	const audioHandlers = useRef<{ [key: string]: () => void }>({});

	const rebind = () => {
		unbind();

		const audio = audioRef.current;
		if (!audio) {
			return;
		};

		audioHandlers.current = {
			canplay: () => onTimeUpdate(),
			timeupdate: () => onTimeUpdate(),
			play: () => onPlayHandler(),
			ended: () => onPauseHandler(),
			pause: () => onPauseHandler(),
		};

		U.Dom.addEvents(audio, Object.entries(audioHandlers.current));
	};

	const unbind = () => {
		const audio = audioRef.current;
		if (!audio) {
			return;
		};

		U.Dom.removeEvents(audio, Object.entries(audioHandlers.current));
		audioHandlers.current = {};
	};

	const resize = () => {
		timeRef.current?.resize();
	};

	const onPlayClick = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		U.Dom.pauseMedia();
		isPlaying.current ? pause() : play();
	};

	const onPlayHandler = () => {
		isPlaying.current = true;
		setPlayingState(true);
		onPlay?.();
	};

	const onPauseHandler = () => {
		isPlaying.current = false;
		setPlayingState(false);
		onPause?.();
	};

	const play = () => {
		audioRef.current?.play().catch(() => {});
	};

	const pause = () => {
		audioRef.current.pause();
	};

	const onMute = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		isMuted.current = !isMuted.current;
		onVolume(volume.current);
	};

	const onVolume = (v: number) => {
		volume.current = v;
		audioRef.current.volume = v * (isMuted.current ? 0 : 1);

		checkVolumeClass();
	};

	const checkVolumeClass = () => {
		setMutedState(!(!isMuted.current && volume.current));
	};

	const onTime = (v: number) => {
		const ref = audioRef.current;
		if (!ref) {
			return;
		};

		if (!ref.paused) {
			pause();
			playOnSeek.current = true;
		};

		ref.currentTime = Number(v * ref.duration) || 0;
	};

	const onTimeEnd = (v: number) => {
		if (playOnSeek.current) {
			play();
		};
	};

	const scrollAudioHandler = useRef<(() => void) | null>(null);

	const positionDrag = () => {
		const drag = volumeRef.current?.getNode() as HTMLElement;
		const icon = volumeIconRef.current as HTMLElement;
		if (!drag || !icon) {
			return;
		};

		const height = icon.offsetHeight;
		const rect = icon.getBoundingClientRect();
		const left = rect.left + window.scrollX;
		const top = rect.top + window.scrollY;

		U.Dom.css(drag, {
			left: `${left}px`,
			top: `${top - height - 4 - 72 - window.scrollY}px`,
		});
	};

	const onVolumeEnter = () => {
		const drag = volumeRef.current?.getNode() as HTMLElement;
		const container = getScrollContainer?.() as HTMLElement;
		if (!drag) {
			return;
		};

		U.Dom.css(drag, { display: 'block' });
		positionDrag();
		clearTimeout(timeoutRef.current);

		if (frameRef.current) {
			raf.cancel(frameRef.current);
		};

		frameRef.current = raf(() => {
			U.Dom.addClass(drag, 'active');

			if (container) {
				if (scrollAudioHandler.current) {
					U.Dom.removeEvent(container, 'scroll', scrollAudioHandler.current);
				};
				scrollAudioHandler.current = () => { U.Dom.css(drag, { display: 'none' }); };
				U.Dom.addEvent(container, 'scroll', scrollAudioHandler.current);
			};
		});
	};

	const onVolumeLeave = () => {
		const drag = volumeRef.current?.getNode() as HTMLElement;
		const container = getScrollContainer?.() as HTMLElement;
		if (!drag) {
			return;
		};

		U.Dom.removeClass(drag, 'active');
		timeoutRef.current = window.setTimeout(() => { U.Dom.css(drag, { display: 'none' }); }, 200);

		if (container && scrollAudioHandler.current) {
			U.Dom.removeEvent(container, 'scroll', scrollAudioHandler.current);
			scrollAudioHandler.current = null;
		};
	};

	const onTimeUpdate = () => {
		const audio = audioRef.current;
		const ref = timeRef.current;

		if (!ref || !audio) {
			return;
		};

		const { m, s } = getTime(isPlaying.current ? audio.currentTime : audio.duration);

		if (timeTextRef.current) {
			timeTextRef.current.textContent = `${U.String.sprintf('%02d', m)}:${U.String.sprintf('%02d', s)}`;
		};
		ref.setValue(audio.currentTime / audio.duration);
	};

	const getTime = (t: number): { m: number, s: number } => {
		t = Number(t) || 0;

		const m = Math.floor(t / 60);

		t -= m * 60;
		const s = Math.floor(t);

		return { m, s };
	};

	useEffect(() => {
		onVolume(1);
		resize();

		const resizeObserver = new ResizeObserver(() => {
			raf(() => resize());
		});

		if (nodeRef.current) {
			resizeObserver.observe(nodeRef.current);
		};

		return () => {
			unbind();
			resizeObserver.disconnect();

			const container = getScrollContainer?.() as HTMLElement;
			if (container && scrollAudioHandler.current) {
				U.Dom.removeEvent(container, 'scroll', scrollAudioHandler.current);
			};

			if (frameRef.current) {
				raf.cancel(frameRef.current);
			};

			clearTimeout(timeoutRef.current);
		};
	}, []);

	useEffect(() => {
		rebind();

		if (playlist.length) {
			setCurrent(playlist[0]);
		};
	});

	useImperativeHandle(ref, () => ({
		updatePlaylist: (playlist: PlaylistItem[]) => {
			playlist = playlist || [];

			if (playlist.length) {
				setCurrent(playlist[0]);
			};
		},
		onPlay: onPlayHandler,
		onPause: onPauseHandler,
	}));

	return (
		<div
			ref={nodeRef}
			className="wrap audio mediaAudio"
		>
			<audio ref={audioRef} preload="auto" src={src} />

			<div className="controlsWrapper">
				<Label text={name} tooltipParam={{ text: name }} className="name" />

				<div className="controls">
					<Icon
						name={playingState ? 'control/audio/pause' : 'control/audio/play'}
						color="default"
						onMouseDown={onPlayClick}
						onClick={e => e.stopPropagation()}
					/>

					<div className="timeDragWrapper">
						<DragHorizontal
							id="timeDrag"
							ref={timeRef}
							value={0}
							onStart={(e: any, v: number) => onTime(v)}
							onMove={(e: any, v: number) => onTime(v)}
							onEnd={(e: any, v: number) => onTimeEnd(v)}
						/>
					</div>

					<div className="timeText">
						<span ref={timeTextRef} />
					</div>

					<div className="volumeWrap" onMouseLeave={onVolumeLeave}>
						<Icon
							ref={volumeIconRef}
							name={mutedState ? 'control/audio/mute' : 'control/audio/volume'}
							color="default"
							onMouseDown={onMute}
							onMouseEnter={onVolumeEnter}
							onClick={e => e.stopPropagation()}
						/>

						<DragVertical
							ref={volumeRef}
							id="volume"
							className="volume"
							value={volume.current}
							onChange={(e: any, v: number) => onVolume(v)}
							onMouseEnter={onVolumeEnter}
						/>
					</div>
				</div>
			</div>
		</div>
	);

});

export default MediaAudio;