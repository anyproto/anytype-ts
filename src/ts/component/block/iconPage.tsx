import * as React from 'react';
import { IconObject } from 'Component';
import { I, UtilObject } from 'Lib';
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
			<IconObject 
				id={`block-icon-${rootId}`} 
				canEdit={!readonly} 
				getObject={() => detailStore.get(rootId, rootId, [])} 
				onSelect={this.onSelect} 
				onUpload={this.onUpload} 
				size={96} 
			/>
		);
	};

	onSelect (icon: string) {
		UtilObject.setIcon(this.props.rootId, icon, '');
	};

	onUpload (objectId: string) {
		UtilObject.setIcon(this.props.rootId, '', objectId);
	};
	
});

export default BlockIconPage;