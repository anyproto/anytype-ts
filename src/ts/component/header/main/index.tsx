import * as React from 'react';
import { Icon } from 'ts/component';
import { observer, inject } from 'mobx-react';
import { dispatcher, I, Util} from 'ts/lib';

interface Props {
	commonStore?: any;
	blockStore?: any;
};

const com = require('proto/commands.js');

@inject('commonStore')
@inject('blockStore')
@observer
class HeaderMainIndex extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onNew = this.onNew.bind(this);
	};

	render () {
		return (
			<div className="header">
				<Icon className="logo" />
				<div className="menu">
					<div className="item" onClick={this.onNew}>
						<Icon className="new" /> New
					</div>
				</div>
			</div>
		);
	};
	
	onNew (e: any) {
		const { commonStore, blockStore } = this.props;
		const { root } = blockStore;
		
		commonStore.progressSet({ status: 'Creating page...' });

		let block: any = {};
		block.fields = { 
			icon: Util.randomSmile(), 
			name: 'Untitled' 
		};
		block[I.BlockType.Page] = com.anytype.model.Block.Content.Page.create({
			style: I.PageStyle.Empty,
		});
		block = com.anytype.model.Block.create(block);
		
		let request = {
			block: block,
			contextId: root,
			parentId: root,
			targetId: '',
			position: I.BlockPosition.After,
		};
		dispatcher.call('blockCreate', request, (errorCode: any, message: any) => {
			commonStore.progressClear();
			commonStore.popupOpen('editorPage', {
				data: { id: message.blockId }
			});
		});
	};
	
};

export default HeaderMainIndex;