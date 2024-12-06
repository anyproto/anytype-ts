import React, { forwardRef, useRef, useEffect } from 'react';
import $ from 'jquery';
import { U } from 'Lib';
import { Icon } from 'Component';

interface Props {
	src: string;
	canPlay?: boolean;
	onPlay?(): void;
	onPause?(): void;
	onClick?(e: any): void;
	onLoad?(): void;
};

const MediaVideo = forwardRef<HTMLDivElement, Props>(({
	src = '',
	canPlay = true,
	onPlay,
	onPause = () => {},
	onClick = () => {},
	onLoad = () => {},
}, ref: any) => {

	const nodeRef = useRef(null);
	const videoRef = useRef(null);

	const rebind = () => {
		unbind();

		const video = $(videoRef.current);

		video.on('play', () => onPlayHandler());
		video.on('pause', () => onPause());
		video.on('ended', () => onEnded());
		video.on('canplay', () => onLoad());
	};

	const unbind = () => {
		$(videoRef.current).off('canplay ended pause play');
	};

	const onPlayHandler = () => {
		if (videoRef.current) {
			videoRef.current.controls = true;
		};
		$(nodeRef.current).addClass('isPlaying');

		if (onPlay) {
			onPlay();
		};
	};

	const onEnded = () => {
		if (videoRef.current) {
			videoRef.current.controls = false;
		};
		$(nodeRef.current).removeClass('isPlaying');

		onPause();
	};

	const onPlayClick = (e: any) => {
		if (!canPlay) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		U.Common.pauseMedia();
		videoRef.current?.play();
	};

	useEffect(() => {
		rebind();
		return () => unbind();
	});

	return (
		<div
			ref={nodeRef}
			className="mediaVideo"
			onClick={onClick}
		>
			<video ref={videoRef} className="media" controls={false} preload="auto" src={src} />

			<div className="controls">
				<Icon className="play" onClick={onPlayClick} />
			</div>
		</div>
	);
});

export default MediaVideo;