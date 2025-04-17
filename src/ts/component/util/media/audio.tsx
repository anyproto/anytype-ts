import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef, MouseEvent } from 'react';
import $ from 'jquery';
import { Icon, DragHorizontal, DragVertical, Floater } from 'Component';
import { U } from 'Lib';

interface PlaylistItem {
	name: string;
	src: string;
};

interface Props {
	playlist: PlaylistItem[];
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
}, ref) => {

	const nodeRef = useRef<HTMLDivElement>(null);
	const audioRef = useRef<HTMLAudioElement>(null);
	const timeRef = useRef(null);
	const timeTextRef = useRef(null);
	const volumeIconRef = useRef(null);
	const playIconRef = useRef(null);
	const floaterRef = useRef(null);
	const resizeObserver = new ResizeObserver(() => resize());
	const [ current, setCurrent ] = useState<PlaylistItem>(null);
	const { src, name }	= current || {};
	const ci = [ 'volume' ];

	const isPlaying = useRef(false);
	const volume = useRef(1);
	const isMuted = useRef(false);
	const playOnSeek = useRef(false);

	const rebind = () => {
		unbind();

		const node = $(audioRef.current);

		node.on('canplay timeupdate', () => onTimeUpdate());
		node.on('play', () => onPlayHandler());
		node.on('ended pause', () => onPauseHandler());
	};

	const unbind = () => {
		$(audioRef.current).off('canplay timeupdate play ended pause');
	};

	const resize = () => {
		timeRef.current?.resize();
	};

	const onPlayClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		U.Common.pauseMedia();
		isPlaying.current ? pause() : play();
	};

	const onPlayHandler = () => {
		isPlaying.current = true;
		$(playIconRef.current).addClass('active');

		if (onPlay) {
			onPlay();
		};
	};

	const onPauseHandler = () => {
		isPlaying.current = false;
		$(playIconRef.current).removeClass('active');

		if (onPause) {
			onPause();
		};
	};

	const play = () => {
		audioRef.current.play();
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
		$(volumeIconRef.current).toggleClass('isMuted', !(!isMuted.current && volume.current));
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

	const onVolumeEnter = () => {
		floaterRef.current.show();
	};

	const onVolumeLeave = () => {
		floaterRef.current.hide();
	};

	const onTimeUpdate = () => {
		const audio = audioRef.current;
		const ref = timeRef.current;

		if (!ref || !audio) {
			return;
		};

		const { m, s } = getTime(isPlaying.current ? audio.currentTime : audio.duration);

		$(timeTextRef.current).text(`${U.Common.sprintf('%02d', m)}:${U.Common.sprintf('%02d', s)}`);
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

		return () => {
			unbind();

			if (nodeRef.current) {
				resizeObserver.unobserve(nodeRef.current);
			};
		};
	}, []);

	useEffect(() => {
		resize();
		rebind();

		if (nodeRef.current) {
			resizeObserver.observe(nodeRef.current);
		};
		setCurrent(playlist[0]);
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
			className="wrap resizable audio mediaAudio"
		>
			<audio ref={audioRef} preload="auto" src={src} />

			<div className="controlsWrapper">
				<div className="name">
					<span>{name}</span>
				</div>

				<div className="controls">
					<Icon 
						ref={playIconRef} 
						className="play" 
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
							className={ci.join(' ')} 
							onMouseDown={onMute}
							onMouseEnter={onVolumeEnter}
							onClick={e => e.stopPropagation()}
						/>

						<Floater 
							ref={floaterRef}
							anchorEl={volumeIconRef.current}
							offset={4}
						>
							<DragVertical
								id="volume"
								className="volume"
								value={volume.current}
								onChange={(e: any, v: number) => onVolume(v)}
								onMouseEnter={onVolumeEnter}
							/>
						</Floater>
					</div>
				</div>
			</div>
		</div>
	);

});

export default MediaAudio;