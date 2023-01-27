import * as React from 'react';
import $ from 'jquery';
import { Icon } from 'Component';

interface Props {
    src: string;
    onPlay?(): void;
    onPause?(): void;
};

class MediaVideo extends React.Component<Props> {

    node: any = null;
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

        video.on('play', () => { this.onPlay(); });
        video.on('pause', () => { this.onPause(); });
        video.on('ended', () => { this.onEnded(); });
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

		video.get(0).controls = false;
		node.removeClass('isPlaying');

		this.onPause();
	};

    onPlayClick (e: any) {
		e.preventDefault();
		e.stopPropagation();

		const node = $(this.node);
		const video = node.find('video');

		console.log('PLAY');

        $('audio, video').each((i: number, item: any) => { item.pause(); });
		video.get(0).play();
    };

};

export default MediaVideo;