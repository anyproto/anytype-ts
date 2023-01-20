import * as React from 'react';
import $ from 'jquery';
import { Icon } from 'Component';

interface Props {
    src: string;
    onPlay?(): void;
    onPause?(): void;
    onEnded?(): void;
};

class MediaVideo extends React.Component<Props> {

    node: any = null;
    videoNode: any = null;
    speed = 1;

    constructor (props: Props) {
        super(props);

        this.onPlayClick = this.onPlayClick.bind(this);
    };

    render () {
        const { src } = this.props;
        return (
            <div
                ref={(ref: any) => { this.node = ref; }}
                className="mediaVideo"
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

        this.videoNode = video.get(0);

        video.on('play', () => { this.onPlay(); });
        video.on('pause', () => { this.onPause(); });
        video.on('ended', () => { this.onEnded(); });
    };

    unbind () {
        const node = $(this.node);
        const video = node.find('video');

        video.off('ended pause play');
    };

	onPlay () {
		const { onPlay } = this.props;
		const node = $(this.node);

		this.videoNode.controls = true;
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
        const { onEnded } = this.props;
		const node = $(this.node);

		this.videoNode.controls = false;
		node.removeClass('isPlaying');

        if (onEnded) {
            onEnded();
        };
	};

    onPlayClick () {
        $('audio, video').each((i: number, item: any) => { item.pause(); });
        
		this.videoNode.play();
    };

};

export default MediaVideo;