import * as React from 'react';
import { IconEmoji } from 'ts/component';
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
		const { iconEmoji, iconImage } = details;
		
		return (
			<React.Fragment>
				<IconEmoji 
					id={'block-icon-' + rootId} 
					canEdit={!readOnly} 
					size={32} 
					icon={iconEmoji} 
					hash={iconImage} 
					offsetX={0} 
					offsetY={16} 
					onSelect={this.onSelect} 
					onUpload={this.onUpload} 
					menuId="smile"
					className="c64" 
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