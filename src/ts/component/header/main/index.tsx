import * as React from 'react';
import { Icon } from 'ts/component';
import { observer, inject } from 'mobx-react';
import { dispatcher, I, Util} from 'ts/lib';

interface Props {
	commonStore?: any;
	blockStore?: any;
};

const com = require('proto/commands.js');
const Constant = require('json/constant.json');

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
		
		commonStore.progressSet({ status: 'Creating page...', current: 0, total: 1 });

		let request = {
			block: blockStore.prepareBlockToProto({
				type: I.BlockType.Page,
				fields: { 
					icon: Util.randomSmile(), 
					name: Constant.untitled,
				},
				content: {
					style: I.PageStyle.Empty,
				},
			}),
			contextId: root,
			parentId: root,
			targetId: '',
			position: I.BlockPosition.After,
		};
		
		dispatcher.call('blockCreate', request, (errorCode: any, message: any) => {
			commonStore.progressSet({ status: 'Creating page...', current: 1, total: 1 });
			/*
			commonStore.popupOpen('editorPage', {
				data: { id: message.blockId }
			});
			*/

			Util.scrollTopEnd();
		});
	};
	
};

export default HeaderMainIndex;