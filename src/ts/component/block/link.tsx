import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Smile } from 'ts/component';
import { I, C, Util, DataUtil } from 'ts/lib';
import { blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {
	rootId: string;
	block: I.Block;
	onKeyDown?(e: any, text?: string, marks?: I.Mark[]): void;
	onKeyUp?(e: any, text?: string, marks?: I.Mark[]): void;
};

const Constant = require('json/constant.json');

@observer
class BlockLink extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onClick = this.onClick.bind(this);
		this.onSelect = this.onSelect.bind(this);
	};

	render() {
		const { rootId, block } = this.props;
		const { id, content } = block;
		const { fields } = content;
		const { icon, name, isArchived } = fields || {};
		const cn = [ 'focusable', 'c' + id, (isArchived ? 'isArchived' : '') ];
		
		return (
			<div className={cn.join(' ')} onKeyDown={this.onKeyDown} onKeyUp={this.onKeyUp}>
				<Smile id={'block-page-' + id} offsetX={28} offsetY={-24} icon={icon} canEdit={true} onSelect={this.onSelect} />
				<div className="name" onClick={this.onClick}>{name}</div>
				<div className="archive">Archived</div>
			</div>
		);
	};
	
	onKeyDown (e: any) {
		this.props.onKeyDown(e, '', []);
	};
	
	onKeyUp (e: any) {
		this.props.onKeyUp(e, '', []);
	};
	
	onClick (e: any) {
		const { rootId, block } = this.props;
		const { id, content } = block;
		const { targetBlockId } = content;
		
		if (targetBlockId != rootId) {
			DataUtil.pageOpen(e, this.props, id, targetBlockId);
		};
	};
	
	onSelect (icon: string) {
		const { block } = this.props;
		const { content } = block;
		const { targetBlockId } = content;
		
		C.BlockSetIconName(targetBlockId, targetBlockId + '-icon', icon);
	};
	
};

export default BlockLink;