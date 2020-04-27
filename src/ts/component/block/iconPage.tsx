import * as React from 'react';
import { Smile, Icon } from 'ts/component';
import { I, C, DataUtil } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props {
	rootId: string;
	block: I.Block;
};

@observer
class BlockIconPage extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);
		
		this.onSelect = this.onSelect.bind(this);
	};

	render (): any {
		const { rootId } = this.props;
		const details = blockStore.getDetail(rootId, rootId);
		const { iconEmoji } = details;
		
		return (
			<React.Fragment>
				<Smile id={'block-icon-' + rootId} canEdit={true} size={32} icon={iconEmoji} offsetX={0} offsetY={16} onSelect={this.onSelect} className={'c64 ' + (commonStore.menuIsOpen('smile') ? 'active' : '')} />
			</React.Fragment>
		);
	};
	
	onSelect (icon: string) {
		const { rootId } = this.props;
		DataUtil.pageSetIcon(rootId, icon, '');
	};
	
};

export default BlockIconPage;