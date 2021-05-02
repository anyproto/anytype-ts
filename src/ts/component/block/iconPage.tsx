import * as React from 'react';
import { IconObject } from 'ts/component';
import { I, DataUtil } from 'ts/lib';
import { blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.BlockComponent {};

@observer
class BlockIconPage extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);
		
		this.onSelect = this.onSelect.bind(this);
		this.onUpload = this.onUpload.bind(this);
	};

	render (): any {
		const { rootId, readOnly } = this.props;
		const details = blockStore.getDetails(rootId, rootId);
		
		return (
			<React.Fragment>
				<IconObject 
					id={'block-icon-' + rootId} 
					canEdit={!readOnly} 
					object={details} 
					offsetX={0} 
					offsetY={16} 
					onSelect={this.onSelect} 
					onUpload={this.onUpload} 
					size={96} 
				/>
			</React.Fragment>
		);
	};

	onSelect (icon: string) {
		const { rootId } = this.props;
		DataUtil.pageSetIcon(rootId, icon, '');
	};

	onUpload (hash: string) {
		const { rootId } = this.props;
		DataUtil.pageSetIcon(rootId, '', hash);
	};
	
};

export default BlockIconPage;