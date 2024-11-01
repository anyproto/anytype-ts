import * as React from 'react';
import $ from 'jquery';
import { Icon, DragHorizontal, DragVertical } from 'Component';
import { U } from 'Lib';
import { Floater } from '../floater';
import _ from 'lodash';

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
	volume: number;
	muted: boolean;
	showVolumeSlider: boolean;
	timeMetric: string;
};

class MediaAudio extends React.PureComponent<Props, State> {

	node: HTMLDivElement = null;
	timeDragRef: DragHorizontal = null;
	audioNode: HTMLAudioElement = null;
	volumeIcon: Icon = null;

	playOnSeek = false;
	current: PlaylistItem = { name: '', src: '' };
	resizeObserver: ResizeObserver;
	fadeOutVolumeSlider = _.debounce(() => this.setState({ showVolumeSlider: false }), 500);

	startedPlaying = false;

	constructor (props: Props) {
		super(props);

		this.state = {
			volume: 1,
			muted: false,
			showVolumeSlider: false,
			timeMetric: '',
		};

		this.onPlayClick = this.onPlayClick.bind(this);
		this.onMute = this.onMute.bind(this);
		this.onResize = this.onResize.bind(this);
		this.resizeObserver = new ResizeObserver(this.onResize);
	};

	render () {
		const { volume, muted } = this.state;
		const { src, name }	= this.current;
		const iconClasses = [ 'volume'];

		if (!volume || muted) {
			iconClasses.push('muted');
		};

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
								id="time"
								ref={ref => this.timeDragRef = ref}
								value={0}
								onStart={(e: any, v: number) => this.onTime(v)}
								onMove={(e: any, v: number) => this.onTime(v)}
								onEnd={(e: any, v: number) => this.onTimeEnd(v)}
							/>
						</div>

						<div className="time">
							<span id="timeMetric" className="metric">{this.state.timeMetric}</span>
						</div>
						<div
							onMouseLeave={this.fadeOutVolumeSlider}
						>
							<Icon
								onMouseEnter={() => {
									this.fadeOutVolumeSlider.cancel();
									return this.setState({ showVolumeSlider: true });
								}}
								ref={el => this.volumeIcon = el} 
								className={iconClasses.join(' ')} 
								onClick={this.onMute} 
							/>

							<Floater 
								anchorEl={this.volumeIcon?.node} 
								isShown={this.state.showVolumeSlider}
								gap={8}
							>
								<DragVertical
									id="volume"
									className="volume"
									value={volume * (muted ? 0 : 1)}
									onChange={(e: any, v: number) => this.onVolume(v)}
									onMouseEnter={() => {
										this.fadeOutVolumeSlider.cancel();
										return this.setState({ showVolumeSlider: true });
									}}
									
								/>
							</Floater>
						</div>
					</div>
				</div>
			</div>
		);
	};

	componentDidMount () {
		const { playlist } = this.props;

		if (playlist.length) {
			this.current = playlist[0];
		};

		this.resizeObserver.observe(this.node);

		this.forceUpdate();
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

		this.audioNode = el.get(0) as HTMLAudioElement;

		if (el.length) {
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

	resize () {
		if (this.timeDragRef) {
			this.timeDragRef.resize();
		};
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
		this.audioNode.play();
	};

	pause () {
		this.audioNode.pause();
	};

	onMute (e: React.MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		
		const muted = !this.state.muted;
		this.setState({ muted });
		this.audioNode.volume = this.state.volume * (muted ? 0 : 1);
	};

	onVolume (volume: number) {
		this.setState({ volume });
		this.audioNode.volume = volume * (this.state.muted ? 0 : 1);
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

	onTimeUpdate () {
		const el = this.audioNode;
		if (!el) {
			return;
		};

		const t = this.startedPlaying ? this.getTime(el.currentTime) : this.getTime(el.duration);
		this.setState({ timeMetric: `${U.Common.sprintf('%02d', t.m)}:${U.Common.sprintf('%02d', t.s)}`});
		this.timeDragRef.setValue(el.currentTime / el.duration);
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