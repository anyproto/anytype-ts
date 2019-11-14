import * as React from 'react';
import { InputWithFile, Loader } from 'ts/component';
import { I } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props extends I.BlockMedia {
	blockStore?: any;
};

interface State {
	media: string;
};

@inject('blockStore')
@observer
class BlockImage extends React.Component<Props, {}> {

	state = {
		media: ''
	};

	constructor (props: any) {
		super(props);
	};

	render () {
		const { blockStore, header } = this.props;
		const { blocks } = blockStore;
		const block = blocks.find((item: I.Block) => { return item.header.id == header.id; });
		
		if (!block) {
			return null;
		};
		
		const { content } = block;
		const { link, uploadState } = content;
		
		let element = null;
		switch (uploadState) {
			default:
			case I.ContentUploadState.Empty:
				element = (
					<InputWithFile icon="image" textFile="Upload a picture" />
				);
				break;
				
			case I.ContentUploadState.Loading:
				element = (
					<Loader />
				);
				break;
				
			case I.ContentUploadState.Done:
				element = (
					<div />
				);
				break;
		};
		
		return (
			<React.Fragment>
				{element}
			</React.Fragment>
		);
	};
	
	componentDidMount () {
		this.load();
	};
	
	componentDidUpdate () {
		this.load();
	};
	
	load () {
		const { media } = this.state;
		const { blockStore, header } = this.props;
		const { blocks } = blockStore;
		const block = blocks.find((item: I.Block) => { return item.header.id == header.id; });
		
		if (media || !block) {
			return;
		};
		
		const { content } = block;
		const { link } = content;
	};
	
};

export default BlockImage;