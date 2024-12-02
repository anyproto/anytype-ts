import * as React from 'react';
import $ from 'jquery';
import { Icon, DragHorizontal, DragVertical } from 'Component';
import { U } from 'Lib';
import { Floater } from '../floater';

interface PlaylistItem {
	name: string;
	src: string;
};

interface Props {
	playlist: PlaylistItem[];
	onPlay?(): void;
	onPause?(): void;
};

interface State {
	current: PlaylistItem;
};

class MediaAudio extends React.PureComponent<Props, State> {

	node: HTMLDivElement = null;
	audioNode: HTMLAudioElement = null;
	refTime = null;
	refVolumeIcon = null;
	refFloater = null;
	isMuted = false;
	volume = 1;

	playOnSeek = false;
	current: PlaylistItem = { name: '', src: '' };
	resizeObserver: ResizeObserver;

	startedPlaying = false;

	constructor (props: Props) {
		super(props);

		this.state = {
			current: null,
		};

		this.onPlayClick = this.onPlayClick.bind(this);
		this.onMute = this.onMute.bind(this);
		this.onResize = this.onResize.bind(this);
		this.onVolume = this.onVolume.bind(this);
		this.onVolumeEnter = this.onVolumeEnter.bind(this);
		this.onVolumeLeave = this.onVolumeLeave.bind(this);
		this.resizeObserver = new ResizeObserver(this.onResize);
	};

	render () {
		const { current } = this.state;
		const { src, name }	= current || {};
		const ci = [ 'volume' ];

		return (
			<div
				ref={node => this.node = node}
				className="wrap resizable audio mediaAudio"
			>
				<audio id="audio" preload="auto" src={src} />

				<div className="controlsWrapper">
					<div className="name">
						<span>{name}</span>
					</div>

					<div className="controls">
						<Icon className="play" onClick={this.onPlayClick} />

						<div className="timeDragWrapper">
							<DragHorizontal
								id="timeDrag"
								ref={ref => this.refTime = ref}
								value={0}
								onStart={(e: any, v: number) => this.onTime(v)}
								onMove={(e: any, v: number) => this.onTime(v)}
								onEnd={(e: any, v: number) => this.onTimeEnd(v)}
							/>
						</div>

						<div className="timeText">
							<span id="time" />
						</div>

						<div className="volumeWrap" onMouseLeave={this.onVolumeLeave}>
							<Icon
								ref={ref => this.refVolumeIcon = ref} 
								className={ci.join(' ')} 
								onClick={this.onMute} 
								onMouseEnter={this.onVolumeEnter}
							/>

							<Floater 
								ref={ref => this.refFloater = ref}
								anchorEl={this.refVolumeIcon}
								offset={4}
							>
								<DragVertical
									id="volume"
									className="volume"
									value={this.volume}
									onChange={(e: any, v: number) => this.onVolume(v)}
									onMouseEnter={this.onVolumeEnter}
								/>
							</Floater>
						</div>
					</div>
				</div>
			</div>
		);
	};

	componentDidMount () {
		const playlist = this.getPlaylist();

		this.setState({ current: playlist[0] });
		this.resizeObserver.observe(this.node);
	};

	componentDidUpdate () {
		this.resize();
		this.rebind();
	};

	componentWillUnmount () {
		this.unbind();
		this.resizeObserver.unobserve(this.node);
	};

	rebind () {
		this.unbind();

		const node = $(this.node);
		const el = node.find('#audio');

		if (el.length) {
			this.audioNode = el.get(0) as HTMLAudioElement;

			el.on('canplay timeupdate', () => this.onTimeUpdate());
			el.on('play', () => this.onPlay());
			el.on('ended pause', () => this.onPause());
		};
	};

	unbind () {
		const node = $(this.node);
		const el = node.find('#audio');

		if (el.length) {
			el.off('canplay timeupdate play ended pause');
		};
	};

	getPlaylist () {
		return this.props.playlist || [];
	};

	updatePlaylist (playlist: PlaylistItem[]) {
		playlist = playlist || [];

		this.setState({ current: playlist[0] });
	};

	resize () {
		this.refTime?.resize();
	};

	onResize () {
		this.resize();
		this.rebind();
	};

	onPlayClick (e: React.MouseEvent) {
		e.preventDefault();
		e.stopPropagation();

		const el = this.audioNode;
		const paused = el.paused;

		U.Common.pauseMedia();
		paused ? this.play() : this.pause();
	};

	onPlay () {
		this.startedPlaying = true;

		const { onPlay } = this.props;
		const node = $(this.node);
		const icon = node.find('.icon.play');
		
		icon.addClass('active');

		if (onPlay) {
			onPlay();
		};
	};

	onPause () {
		const { onPause } = this.props;
		const node = $(this.node);
		const icon = node.find('.icon.play');

		icon.removeClass('active');

		if (onPause) {
			onPause();
		};
	};

	play () {
		this.audioNode?.play();
	};

	pause () {
		this.audioNode?.pause();
	};

	onMute (e: React.MouseEvent) {
		e.preventDefault();
		e.stopPropagation();

		this.isMuted = !this.isMuted;
		this.audioNode.volume = this.volume * (this.isMuted ? 0 : 1);
		this.checkVolumeClass();
	};

	onVolume (v: number) {
		this.volume = v * (this.isMuted ? 0 : 1);
		this.audioNode.volume = this.volume;
		this.checkVolumeClass();
	};

	checkVolumeClass () {
		const node = $(this.node);
		const icon = node.find('.icon.volume');

		icon.toggleClass('isMuted', this.isMuted || !this.volume);
	};

	onTime (v: number) {
		const paused = this.audioNode.paused;

		if (!paused) {
			this.pause();
			this.playOnSeek = true;
		};

		this.audioNode.currentTime = Number(v * this.audioNode.duration) || 0;
	};

	onTimeEnd (v: number) {
		if (this.playOnSeek) {
			this.play();
		};
	};

	onVolumeEnter () {
		this.refFloater.show();
	};

	onVolumeLeave () {
		this.refFloater.hide();
	};

	onTimeUpdate () {
		const el = this.audioNode;
		if (!el) {
			return;
		};

		const node = $(this.node);
		const time = node.find('#time');
		const t = this.startedPlaying ? this.getTime(el.currentTime) : this.getTime(el.duration);

		time.text(`${U.Common.sprintf('%02d', t.m)}:${U.Common.sprintf('%02d', t.s)}`);
		this.refTime.setValue(el.currentTime / el.duration);
	};

	getTime (t: number): { m: number, s: number } {
		t = Number(t) || 0;

		const m = Math.floor(t / 60);

		t -= m * 60;
		const s = Math.floor(t);

		return { m, s };
	};

};

export default MediaAudio;