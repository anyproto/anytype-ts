import * as React from 'react';
import $ from 'jquery';
import { Icon, Drag } from 'Component';
import { U } from 'Lib';
import VerticalDrag from 'Component/form/verticalDrag';
import ReactDOM from 'react-dom';
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

class MediaAudio extends React.Component<Props> {
    node: HTMLDivElement = null;
    timeDragRef: Drag = null;
    audioNode: HTMLAudioElement = null;
    volumeIconDiv: HTMLDivElement = null;

    volume = 0;
    playOnSeek = false;
    current: PlaylistItem = { name: '', src: '' };

    nodeResizeObserver: ResizeObserver;

    constructor (props: Props) {
        super(props);
        this.onPlayClick = this.onPlayClick.bind(this);
        this.onMute = this.onMute.bind(this);
        this.onResize = this.onResize.bind(this);
        this.nodeResizeObserver = new ResizeObserver(this.onResize);
    };

    render () {
        return (
            <div
                ref={node => this.node = node}
                className="wrap resizable audio mediaAudio"
            >
                <audio id="audio" preload="auto" src={this.current.src} />

                <div className="controls">
                    <div className="name">
                        <span>{this.current.name}</span>
                    </div>
                    <div className="controlsWrapper">
                        <Icon className="play" onClick={this.onPlayClick} />

                        <div className="timeDragWrapper">
                            <Drag
                                id="time"
                                ref={ref => this.timeDragRef = ref}
                                value={0}
                                onStart={(e: any, v: number) => this.onTime(v)}
                                onMove={(e: any, v: number) => this.onTime(v)}
                                onEnd={(e: any, v: number) => this.onTimeEnd(v)}
                            />
                        </div>

                        <div className="time">
                            <span id="timeCurrent" className="current">0:00</span>&nbsp;/&nbsp;
                            <span id="timeTotal" className="total">0:00</span>
                        </div>
                        <div className="volumeWrapper">
                                <Icon
                                ref={el => {
                                    if (el) {
                                        this.volumeIconDiv = el.node;
                                    }
                                }} 
                                className="volume" 
                                onClick={this.onMute} />
                            <Floater anchorEl={this.volumeIconDiv}>
                                <VerticalDrag
                                    id="volume"
                                    value={0}
                                    onChange={(e: any, v: number) => this.onVolume(v)}
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

        this.nodeResizeObserver.observe(this.node);

        this.forceUpdate();
    };

    componentDidUpdate () {
        this.resize();
        this.rebind();
    };

    componentWillUnmount () {
        this.unbind();
        this.nodeResizeObserver.disconnect();
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
    }

    onPlayClick (e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();

        const el = this.audioNode;
        const paused = el.paused;

        U.Common.pauseMedia();
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

    onMute (e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();

        const newVolume = this.volume || 1;
        this.audioNode.volume = newVolume;

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
        current.text(`${U.Common.sprintf('%02d', t.m)}:${U.Common.sprintf('%02d', t.s)}`);

        t = this.getTime(el.duration);
        total.text(`${U.Common.sprintf('%02d', t.m)}:${U.Common.sprintf('%02d', t.s)}`);

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