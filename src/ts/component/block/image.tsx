import * as React from 'react';
import { InputWithFile } from 'ts/component';
import { I, keyBoard } from 'ts/lib';
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
			return <div />;
		};
		
		const { content } = block;
		const { link } = content;
		
		return (
			<React.Fragment>
				<InputWithFile icon="image" textFile="Upload a picture" />
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