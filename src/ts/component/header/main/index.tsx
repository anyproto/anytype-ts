import * as React from 'react';
import { Icon } from 'ts/component';
import { observer, inject } from 'mobx-react';
import { I, C, Util} from 'ts/lib';

interface Props {
	commonStore?: any;
	blockStore?: any;
};

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
						<Icon className="new" />New
					</div>
				</div>
			</div>
		);
	};
	
	onNew (e: any) {
		const { commonStore, blockStore } = this.props;
		const { root } = blockStore;
		
		commonStore.progressSet({ status: 'Creating page...', current: 0, total: 1 });

		const block = {
			type: I.BlockType.Page,
			fields: { 
				icon: Util.randomSmile(), 
				name: Constant.untitled,
			},
			content: {
				style: I.PageStyle.Empty,
			},
		};

		C.BlockCreate(block, root, '', I.BlockPosition.Bottom, (message: any) => {
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