import React, { forwardRef, useRef, useEffect } from 'react';
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

		const video = videoRef.current;
		if (!video) {
			return;
		};

		U.Dom.addEvents(video, [
			['play', onPlayHandler],
			['pause', onPause],
			['ended', onEnded],
			['canplay', onLoad],
			['loadedmetadata', onMetaData],
		]);
	};

	const unbind = () => {
		const video = videoRef.current;
		if (!video) {
			return;
		};

		U.Dom.removeEvents(video, [
			['play', onPlayHandler],
			['pause', onPause],
			['ended', onEnded],
			['canplay', onLoad],
			['loadedmetadata', onMetaData],
		]);
	};

	const onPlayHandler = (e: any) => {
		if (videoRef.current) {
			videoRef.current.controls = true;
		};
		U.Dom.addClass(nodeRef.current, 'isPlaying');

		onPlay?.(e);
	};

	const onEnded = (e) => {
		if (videoRef.current) {
			videoRef.current.controls = false;
		};
		U.Dom.removeClass(nodeRef.current, 'isPlaying');

		onPause?.(e);
	};

	const onPlayClick = (e: any) => {
		if (!canPlay) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		U.Dom.pauseMedia();
		videoRef.current?.play().catch(() => {});
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
				<Icon name="popup/preview/play" size={44} className="play" onClick={onPlayClick} />
			</div>
		</div>
	);
});

export default MediaVideo;
