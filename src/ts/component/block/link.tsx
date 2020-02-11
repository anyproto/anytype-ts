import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Smile } from 'ts/component';
import { I, C, Util, DataUtil } from 'ts/lib';
import { blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Block, RouteComponentProps<any> {
	rootId: string;
};

const Constant = require('json/constant.json');

@observer
class BlockLink extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
		this.onSelect = this.onSelect.bind(this);
	};

	render() {
		const { id, rootId, content } = this.props;
		const { fields, isArchived } = content;
		const { icon, name } = fields || {};
		
		return (
			<div className={isArchived ? 'isArchived' : ''}>
				<Smile id={'block-page-' + id} offsetX={28} offsetY={-24} icon={icon} canEdit={true} onSelect={this.onSelect} />
				<div className="name" onClick={this.onClick}>{name}</div>
				<div className="archive">Archived</div>
			</div>
		);
	};
	
	onClick (e: any) {
		const { content, id, rootId } = this.props;
		const { targetBlockId } = content;
		
		if (targetBlockId != rootId) {
			DataUtil.pageOpen(e, this.props, id, targetBlockId);
		};
	};
	
	onSelect (icon: string) {
		const { content } = this.props;
		const { targetBlockId } = content;
		
		C.BlockSetIconName(targetBlockId, targetBlockId + '-icon', icon);
	};
	
};

export default BlockLink;