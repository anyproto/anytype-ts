import React, { forwardRef, useRef, useEffect } from 'react';
import $ from 'jquery';
import { U } from 'Lib';
import { Icon } from 'Component';

interface Props {
	src: string;
	canPlay?: boolean;
	onPlay?(e: any): void;
	onPause?(e: any): void;
	onClick?(e: any): void;
	onLoad?(e: any): void;
	onMetaData?(e: any): void;
	onSyncStatusClick?(e: any): void;
};

const MediaVideo = forwardRef<HTMLDivElement, Props>(({
	src = '',
	canPlay = true,
	onPlay,
	onPause = () => {},
	onClick = () => {},
	onLoad = () => {},
	onMetaData = () => {},
	onSyncStatusClick = () => {},
}, ref: any) => {

	const nodeRef = useRef(null);
	const videoRef = useRef(null);

	const rebind = () => {
		unbind();

		const video = $(videoRef.current);

		video.on('play', onPlayHandler);
		video.on('pause', onPause);
		video.on('ended', onEnded);
		video.on('canplay', onLoad);
		video.on('loadedmetadata', onMetaData);
	};

	const unbind = () => {
		$(videoRef.current).off('canplay ended pause play loadedmetadata');
	};

	const onPlayHandler = (e: any) => {
		if (videoRef.current) {
			videoRef.current.controls = true;
		};
		$(nodeRef.current).addClass('isPlaying');

		onPlay?.(e);
	};

	const onEnded = (e) => {
		if (videoRef.current) {
			videoRef.current.controls = false;
		};
		$(nodeRef.current).removeClass('isPlaying');

		onPause?.(e);
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
				<Icon className="syncStatus" onClick={onSyncStatusClick} />
				<Icon className="play" onClick={onPlayClick} />
			</div>
		</div>
	);
});

export default MediaVideo;
