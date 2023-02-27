import * as React from 'react';
import { IconObject } from 'Component';
import { I, ObjectUtil } from 'Lib';
import { detailStore } from 'Store';
import { observer } from 'mobx-react';

const BlockIconPage = observer(class BlockIconPage extends React.Component<I.BlockComponent> {

	constructor (props: I.BlockComponent) {
		super(props);
		
		this.onSelect = this.onSelect.bind(this);
		this.onUpload = this.onUpload.bind(this);
	};

	render (): any {
		const { rootId, readonly } = this.props;
		
		return (
			<React.Fragment>
				<IconObject 
					id={`block-icon-${rootId}`} 
					canEdit={!readonly} 
					getObject={() => detailStore.get(rootId, rootId, [])} 
					onSelect={this.onSelect} 
					onUpload={this.onUpload} 
					size={96} 
				/>
			</React.Fragment>
		);
	};

	onSelect (icon: string) {
		ObjectUtil.setIcon(this.props.rootId, icon, '');
	};

	onUpload (hash: string) {
		ObjectUtil.setIcon(this.props.rootId, '', hash);
	};
	
});

export default BlockIconPage;