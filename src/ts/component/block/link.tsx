import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Smile } from 'ts/component';
import { I, C, Util } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props extends I.Block, RouteComponentProps<any> {
	commonStore?: any;
	blockStore?: any;
	rootId: string;
};

const Constant = require('json/constant.json');

@inject('commonStore')
@inject('blockStore')
@observer
class BlockLink extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
		this.onSelect = this.onSelect.bind(this);
	};

	render() {
		const { blockStore, id, rootId, content } = this.props;
		const { fields, isArchived } = content;
		
		let { icon, name } = fields || {};
		
		icon = icon || Constant.defaultIcon;
		name = name || Constant.defaultName;
		
		return (
			<React.Fragment>
				<Smile id={'block-page-' + id} offsetX={28} offsetY={-24} icon={icon} canEdit={true} onSelect={this.onSelect} />
				<div className="name" onClick={this.onClick}>{name}</div>
				{isArchived ? <div className="archived">Archived</div> : ''}
			</React.Fragment>
		);
	};
	
	onClick (e: any) {
		const { commonStore, history, content, rootId } = this.props;
		const { targetBlockId } = content;
		
		if (targetBlockId == rootId) {
			return;
		};

		if (commonStore.popupIsOpen('editorPage')) {
			commonStore.popupClose('editorPage', () => {
				commonStore.popupOpen('editorPage', {
					data: { id: targetBlockId }
				});				
			});
		} else {
			history.push('/main/edit/' + targetBlockId);
		};
	};
	
	onSelect (icon: string) {
		const { content } = this.props;
		const { targetBlockId } = content;
		
		C.BlockSetIconName(targetBlockId, targetBlockId + '-icon', icon);
	};
	
};

export default BlockLink;