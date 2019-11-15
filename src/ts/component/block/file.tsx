import * as React from 'react';
import { InputWithFile, Loader, Icon } from 'ts/component';
import { I, Util } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props extends I.BlockMedia {
	blockStore?: any;
};

@inject('blockStore')
@observer
class BlockFile extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);
		
		this.onOpen = this.onOpen.bind(this);
		this.onDownload = this.onDownload.bind(this);
	};

	render () {
		const { blockStore, header } = this.props;
		const { blocks } = blockStore;
		const block = blocks.find((item: I.Block) => { return item.header.id == header.id; });
		
		if (!block) {
			return null;
		};
		
		const { content } = block;
		const { uploadState } = content;
		
		let element = null;
		switch (uploadState) {
			default:
			case I.ContentUploadState.Empty:
				element = (
					<InputWithFile icon="file" textFile="Upload a file" />
				);
				break;
				
			case I.ContentUploadState.Loading:
				element = (
					<Loader />
				);
				break;
				
			case I.ContentUploadState.Done:
				element = (
					<React.Fragment>
						<span onMouseDown={this.onOpen}>
							<Icon className="type image" />
							<span className="name">Name</span>
							<span className="size">{Util.fileSize(10023450)}</span>
						</span>
						<span className="download" onMouseDown={this.onDownload}>Download</span>
					</React.Fragment>
				);
				break;
		};
		
		return (
			<React.Fragment>
				{element}
			</React.Fragment>
		);
	};
	
	onOpen (e: any) {
	};
	
	onDownload (e: any) {
	};
	
};

export default BlockFile;