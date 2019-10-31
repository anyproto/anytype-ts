import * as React from 'react';
import { Smile } from 'ts/component';
import { I } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props extends I.BlockMedia {
	commonStore?: any;
	blockStore?: any;
};

@inject('commonStore')
@inject('blockStore')
@observer
class BlockIcon extends React.Component<Props, {}> {

	render () {
		const { commonStore, blockStore, header } = this.props;
		const { blocks } = blockStore;
		const block = blocks.find((item: I.Block) => { return item.header.id == header.id; });
		
		if (!block) {
			return <div />;
		};
		
		const { content } = block;
		const { icon } = content;
		
		return (
			<React.Fragment>
				<Smile id={'block-icon-' + header.id} canEdit={true} size={24} icon={icon} className={'c48 ' + (commonStore.menuIsOpen('smile') ? 'active' : '')} />
			</React.Fragment>
		);
	};
	
};

export default BlockIcon;