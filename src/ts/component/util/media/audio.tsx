import * as React from 'react';
import $ from 'jquery';
import { Icon, Drag, Input } from 'Component';
import { U } from 'Lib';
import VerticalDrag from 'Component/form/verticalDrag';
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
    startedPlaying: boolean;
    timeMetric: string;
};

class MediaAudio extends React.Component<Props, State> {
    node: HTMLDivElement = null;
    timeDragRef: Drag = null;
    audioNode: HTMLAudioElement = null;
    volumeIconDiv: HTMLDivElement = null;
    volumeSliderRef: HTMLDivElement = null;

    playOnSeek = false;
    current: PlaylistItem = { name: '', src: '' };

    resizeObserver: ResizeObserver;

    volumeSliderFadeOut = _.debounce(() => this.setState({ showVolumeSlider: false }), 1200);

    constructor (props: Props) {
        super(props);
        this.state = {
            volume: 1,
            muted: false,
            showVolumeSlider: false,
            startedPlaying: false,
            timeMetric: '',
        };
        this.onPlayClick = this.onPlayClick.bind(this);
        this.onMute = this.onMute.bind(this);
        this.onResize = this.onResize.bind(this);
        this.resizeObserver = new ResizeObserver(this.onResize);
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
                            <span id="timeMetric" className="metric">{this.state.timeMetric}</span>
                        </div>
                        <div
                            onMouseLeave={this.volumeSliderFadeOut}
                            >
                            <Icon
                                onMouseMove={() => this.setState({ showVolumeSlider: true })}
                                ref={el => {
                                    this.volumeIconDiv = el?.node;
                                }} 
                                className={`volume ${this.state.volume === 0 || this.state.muted ? 'active' : ''}`} 
                                onClick={this.onMute} 
                                />
                            <Floater 
                                anchorEl={this.volumeIconDiv} 
                                anchorTo={'top'} 
                                offset={{x: 0, y: -2}}>
                                <VerticalDrag
                                    id="volume"
                                    ref={el => {
                                        if (el) {
                                            (el as unknown as HTMLDivElement).addEventListener('animationend', () => {
                                                console.log('animationend');
                                            }   
                                        );
                                        }
                                    }}
                                    className={`volume ${this.state.showVolumeSlider ? 'visible' : ''}`}
                                    value={this.state.volume}
                                    onMouseMove={() => this.setState({ showVolumeSlider: true })}
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
        this.setState({ startedPlaying: true });

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

        const t = this.state.startedPlaying ? this.getTime(el.currentTime) : this.getTime(el.duration);
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