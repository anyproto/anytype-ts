import * as React from 'react';
import { IconObject } from 'Component';
import { I, DataUtil } from 'Lib';
import { detailStore } from 'Store';
import { observer } from 'mobx-react';

interface Props extends I.BlockComponent {};

const BlockIconPage = observer(class BlockIconPage extends React.Component<Props, {}> {

	constructor (props: any) {
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
					getObject={() => { return detailStore.get(rootId, rootId, []); }} 
					onSelect={this.onSelect} 
					onUpload={this.onUpload} 
					size={96} 
				/>
			</React.Fragment>
		);
	};

	onSelect (icon: string) {
		DataUtil.pageSetIcon(this.props.rootId, icon, '');
	};

	onUpload (hash: string) {
		DataUtil.pageSetIcon(this.props.rootId, '', hash);
	};
	
});

export default BlockIconPage;