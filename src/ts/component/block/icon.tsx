import * as React from 'react';
import { Smile } from 'ts/component';
import { I, C } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props extends I.BlockIcon {
	commonStore?: any;
	blockStore?: any;
	rootId: string;
};

const com = require('proto/commands.js');

@inject('commonStore')
@inject('blockStore')
@observer
class BlockIcon extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);
		
		this.onSelect = this.onSelect.bind(this);
	};

	render (): any {
		const { commonStore, blockStore, rootId, id, content } = this.props;
		const { name } = content;

		return (
			<React.Fragment>
				<Smile id={'block-icon-' + id} canEdit={true} size={24} icon={name} offsetX={52} offsetY={-48} onSelect={this.onSelect} className={'c48 ' + (commonStore.menuIsOpen('smile') ? 'active' : '')} />
			</React.Fragment>
		);
	};
	
	onSelect (icon: string) {
		const { id, rootId } = this.props;
		
		C.BlockSetIconName(rootId, id, icon);
	};
	
};

export default BlockIcon;