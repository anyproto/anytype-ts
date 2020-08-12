import * as React from 'react';
import { Smile } from 'ts/component';
import { I, DataUtil } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';
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
				<Smile 
					id={'block-icon-' + rootId} 
					canEdit={!readOnly} 
					size={32} 
					icon={iconEmoji} 
					hash={iconImage} 
					offsetX={0} 
					offsetY={16} 
					onSelect={this.onSelect} 
					onUpload={this.onUpload} 
					className={'c64 ' + (commonStore.menuIsOpen('smile') ? 'active' : '')} 
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