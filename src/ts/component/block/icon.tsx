import * as React from 'react';
import { Smile, Icon } from 'ts/component';
import { I, C } from 'ts/lib';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props {
	rootId: string;
	block: any;
};

const com = require('proto/commands.js');

@observer
class BlockIcon extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);
		
		this.onSelect = this.onSelect.bind(this);
	};

	render (): any {
		const { block } = this.props;
		const { id, content } = block;
		const { name } = content;
		
		return (
			<React.Fragment>
				<Smile id={'block-icon-' + id} canEdit={true} size={32} icon={name} offsetX={0} offsetY={16} onSelect={this.onSelect} className={'c64 ' + (commonStore.menuIsOpen('smile') ? 'active' : '')} />
			</React.Fragment>
		);
	};
	
	onSelect (icon: string) {
		const { rootId, block } = this.props;
		const { id } = block;
		
		C.BlockSetIconName(rootId, id, icon);
	};
	
};

export default BlockIcon;