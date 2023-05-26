import * as React from 'react';
import $ from 'jquery';
import { Icon, Drag } from 'Component';
import { Util } from 'Lib';

interface PlaylistItem {
	name: string; 
	src: string;
};

interface Props {
    playlist: PlaylistItem[];
    onPlay?(): void;
    onPause?(): void;
};

class MediaAudio extends React.Component<Props> {

    node: any = null;
    volume = 0;
    playOnSeek = false;
    refTime: any = null;
    refVolume: any = null;
    current: PlaylistItem = { name: '', src: '' };
    audioNode: HTMLAudioElement;

    constructor (props: Props) {
        super(props);

        this.onPlayClick = this.onPlayClick.bind(this);
        this.onMute = this.onMute.bind(this);
    };

    render () {
        return (
            <div
                ref={node => this.node = node}
                className="wrap resizable audio mediaAudio"
            >
                <audio id="audio" preload="auto" src={this.current.src} />

                <div className="controls">
                    <Icon className="play" onClick={this.onPlayClick} />

                    <div className="name">
                        <span>{this.current.name}</span>
                    </div>

                    <Drag
                        id="time"
                        ref={ref => this.refTime = ref}
                        value={0}
                        onStart={(e: any, v: number) => { this.onTime(v); }}
                        onMove={(e: any, v: number) => { this.onTime(v); }}
                        onEnd={(e: any, v: number) => { this.onTimeEnd(v); }}
                    />

                    <div className="time">
                        <span id="timeCurrent" className="current">0:00</span>&nbsp;/&nbsp;
                        <span id="timeTotal" className="total">0:00</span>
                    </div>

                    <Icon className="volume" onClick={this.onMute} />
                    <Drag
                        id="volume"
                        ref={ref => this.refVolume = ref}
                        value={1}
                        onMove={(e: any, v: number) => { this.onVolume(v); }}
                    />
                </div>
            </div>
        );
    };

    componentDidMount () {
        const { playlist } = this.props;

		if (playlist.length) {
			this.current = playlist[0];
		};

		this.forceUpdate();
    };

    componentDidUpdate () {
        this.resize();
        this.rebind();
    };

    componentWillUnmount () {
        this.unbind();
    };

    rebind () {
        this.unbind();

        const node = $(this.node);
        const el = node.find('#audio');

        this.audioNode = el.get(0) as HTMLAudioElement;

        if (el.length) {
            el.on('canplay timeupdate', () => { this.onTimeUpdate(); });
            el.on('play', () => { this.onPlay(); });
            el.on('ended pause', () => { this.onPause(); });
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
        if (this.refTime) {
            this.refTime.resize();
        };

        if (this.refVolume) {
            this.refVolume.resize();
        };
    };

    onPlayClick () {
        const el = this.audioNode;
        const paused = el.paused;

        Util.pauseMedia();
        paused ? this.play() : this.pause();
    };

	onPlay () {
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

    onMute () {
        this.audioNode.volume = this.audioNode.volume ? 0 : (this.volume || 1);
        this.refVolume.setValue(this.audioNode.volume);
        this.setVolumeIcon();
    };

    onVolume (v: number) {
        const el = this.audioNode;

        this.volume = el.volume = v;
        this.setVolumeIcon();
    };

    setVolumeIcon () {
        const node = $(this.node);
        const icon = node.find('.icon.volume');

        this.audioNode.volume ? icon.removeClass('active') : icon.addClass('active');
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

        const node = $(this.node);
        const current = node.find('#timeCurrent');
        const total = node.find('#timeTotal');

        let t = this.getTime(el.currentTime);
        current.text(`${Util.sprintf('%02d', t.m)}:${Util.sprintf('%02d', t.s)}`);

        t = this.getTime(el.duration);
        total.text(`${Util.sprintf('%02d', t.m)}:${Util.sprintf('%02d', t.s)}`);

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