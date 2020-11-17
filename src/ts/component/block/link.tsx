import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Smile, Loader } from 'ts/component';
import { I, DataUtil } from 'ts/lib';
import { blockStore } from 'ts/store';
import { observer } from 'mobx-react';
import { focus } from 'ts/lib';

interface Props extends I.BlockComponent, RouteComponentProps<any> {};

@observer
class BlockLink extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onClick = this.onClick.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.onUpload = this.onUpload.bind(this);
		this.onFocus = this.onFocus.bind(this);
	};

	render() {
		const { rootId, block, readOnly } = this.props;
		const { id, content } = block;
		const details = blockStore.getDetails(rootId, content.targetBlockId);
		const { _detailsEmpty_, iconEmoji, iconImage, name, isArchived } = details;
		const cn = [ 'focusable', 'c' + id, (isArchived ? 'isArchived' : '') ];

		if (_detailsEmpty_) {
			return (
				<div className="loading">
					<Loader />
					<div className="name">Syncing...</div>
				</div>
			);
		};

		return (
			<div className={cn.join(' ')} tabIndex={0} onKeyDown={this.onKeyDown} onKeyUp={this.onKeyUp} onFocus={this.onFocus}>
				<Smile id={'block-page-' + id} offsetX={28} offsetY={-24} size={20} icon={iconEmoji} hash={iconImage} className="c24" canEdit={!readOnly} onSelect={this.onSelect} onUpload={this.onUpload} />
				<div className="name" onClick={this.onClick}>
					<div className="txt">{name}</div>
				</div>
				<div className="archive">Archived</div>
			</div>
		);
	};
	
	onKeyDown (e: any) {
		this.props.onKeyDown(e, '', [], { from: 0, to: 0 });
	};
	
	onKeyUp (e: any) {
		this.props.onKeyUp(e, '', [], { from: 0, to: 0 });
	};

	onFocus () {
		const { block } = this.props;
		focus.set(block.id, { from: 0, to: 0 });
	};
	
	onClick (e: any) {
		const { rootId, block } = this.props;
		const { content } = block;
		const { targetBlockId } = content;
		const details = blockStore.getDetails(rootId, targetBlockId);
		const { _detailsEmpty_ } = details;
		
		if (!_detailsEmpty_ && (targetBlockId != rootId)) {
			DataUtil.pageOpenEvent(e, targetBlockId);
		};
	};
	
	onSelect (icon: string) {
		const { block } = this.props;
		const { content } = block;
		const { targetBlockId } = content;
		
		DataUtil.pageSetIcon(targetBlockId, icon, '');
	};

	onUpload (hash: string) {
		const { block } = this.props;
		const { content } = block;
		const { targetBlockId } = content;
		
		DataUtil.pageSetIcon(targetBlockId, '', hash);
	};
	
};

export default BlockLink;