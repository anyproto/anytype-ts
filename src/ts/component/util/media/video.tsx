import * as React from 'react';
import $ from 'jquery';
import { Icon } from 'Component';

interface Props {
    src: string,
    onPlay?(): void,
    onPause?(): void,
};

class MediaVideo extends React.Component<Props> {

    node: any = null;
    videoNode: any = null;
    speed = 1;

    constructor (props) {
        super(props);

        this.play = this.play.bind(this);
    };

    render () {
        const { src } = this.props;
        return (
            <div ref={(ref: any) => { this.node = ref; }} className="wrap resizable mediaVideo">
                <video className="media" controls={false} preload="auto" src={src} />

                <div className="controls">
                    <Icon className="play" onClick={this.play} />
                </div>
            </div>
        );
    };

    componentDidMount () {
        this.rebind();
    };

    rebind () {
        const { onPlay, onPause } = this.props;

        this.unbind();

        const node = $(this.node);
        const video = node.find('video');
        this.videoNode = video.get(0);

        video.on('play', () => {
            this.videoNode.controls = true;
            node.addClass('isPlaying');
            if (onPlay) {
                onPlay();
            };
        });

        video.on('pause', () => {
            if (onPause) {
                onPause();
            };
        });

        video.on('ended', () => {
            this.videoNode.controls = false;
            node.removeClass('isPlaying');
            if (onPause) {
                onPause();
            };
        });
    };

    unbind () {
        const node = $(this.node);
        const video = node.find('video');

        video.off('canplay ended pause play');
    };

    play () {
        $('audio, video').each((i: number, item: any) => { item.pause(); });
        this.videoNode.play();
    };
};

export default MediaVideo;