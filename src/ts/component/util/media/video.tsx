import * as React from 'react';
import $ from 'jquery';
import { U } from 'Lib';
import { Icon } from 'Component';

interface Props {
	src: string;
	canPlay?: boolean;
	onPlay?(): void;
	onPause?(): void;
	onClick?(e: any): void;
};

class MediaVideo extends React.Component<Props> {

	public static defaultProps: Props = {
		canPlay: true,
		src: '',
	};

	node: any = null;
	speed = 1;

	constructor (props: Props) {
		super(props);

		this.onPlayClick = this.onPlayClick.bind(this);
	};

	render () {
		const { src, onClick } = this.props;

		return (
			<div
				ref={ref => this.node = ref}
				className="mediaVideo"
				onClick={onClick}
			>
				<video className="media" controls={false} preload="auto" src={src} />

				<div className="controls">
					<Icon className="play" onClick={this.onPlayClick} />
				</div>
			</div>
		);
	};

	componentDidMount () {
		this.rebind();
	};

	rebind () {
		this.unbind();

		const node = $(this.node);
		const video = node.find('video');

		video.on('play', () => this.onPlay());
		video.on('pause', () => this.onPause());
		video.on('ended', () => this.onEnded());
	};

	unbind () {
		const node = $(this.node);
		const video = node.find('video');

		video.off('canplay ended pause play');
	};

	onPlay () {
		const { onPlay } = this.props;
		const node = $(this.node);
		const video = node.find('video');

		if (!video.length) {
			return;
		};

		video.get(0).controls = true;
		node.addClass('isPlaying');

		if (onPlay) {
			onPlay();
		};
	};

	onPause () {
		const { onPause } = this.props;

		if (onPause) {
			onPause();
		};
	};

	onEnded () {
		const node = $(this.node);
		const video = node.find('video');

		if (!video.length) {
			return;
		};

		video.get(0).controls = false;
		node.removeClass('isPlaying');

		this.onPause();
	};

	onPlayClick (e: any) {
		if (!this.props.canPlay) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		const node = $(this.node);
		const video = node.find('video');

		if (!video.length) {
			return;
		};

		U.Common.pauseMedia();
		video.get(0).play();
	};

};

export default MediaVideo;