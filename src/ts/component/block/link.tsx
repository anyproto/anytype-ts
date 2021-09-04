import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { IconObject, Loader } from 'ts/component';
import { I, DataUtil, Util, translate } from 'ts/lib';
import { detailStore } from 'ts/store';
import { observer } from 'mobx-react';
import { focus } from 'ts/lib';

import LinkCard from './link/card';

interface Props extends I.BlockComponent, RouteComponentProps<any> {}

const BlockLink = observer(class BlockLink extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onClick = this.onClick.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.onUpload = this.onUpload.bind(this);
		this.onCheckbox = this.onCheckbox.bind(this);
		this.onFocus = this.onFocus.bind(this);
	};

	render() {
		const { rootId, block, readonly } = this.props;
		const { id, content } = block;
		const object = detailStore.get(rootId, content.targetBlockId);
		const { _empty_, name, isArchived, done, layout } = object;
		const cn = [ 'focusable', 'c' + id ];

		if ((layout == I.ObjectLayout.Task) && done) {
			cn.push('isDone');
		};

		if (isArchived) {
			cn.push('isArchived');
		};

		let cards: any[] = [];
		let sizes = [ 24, 64, 96 ];
		let options = [ {}, { withIcon: true },  { withCover: true }, { withIcon: true, withCover: true } ];
		let classNames = [ 'text', 'card' ];
		let aligns = [ 0, 1, 2 ];

		let addCard = (param: any) => {
			param = Object.assign(param, param.option);
			cards.push(param);
		};

		for (let className of classNames) {
			for (let option of options) {
				for (let align of aligns) {
					if (option.withIcon) {
						for (let size of sizes) {
							addCard({ option, className, iconSize: size, align, object });	
						};
					} else {
						addCard({ option, className, align, object });
					};
				};
			};
		};

		return (
			<div className={cn.join(' ')} tabIndex={0} onKeyDown={this.onKeyDown} onKeyUp={this.onKeyUp} onFocus={this.onFocus}>
				{_empty_ ? (
					<div className="loading" data-target-block-id={content.targetBlockId}>
						<Loader />
						<div className="name">{translate('blockLinkSyncing')}</div>
					</div>
				) : (
					<React.Fragment>
						<IconObject 
							object={object} 
							id={'block-page-' + id} 
							size={24} 
							canEdit={!readonly} 
							onSelect={this.onSelect} 
							onUpload={this.onUpload}
							onCheckbox={this.onCheckbox}
						/>
						<div className="name" onClick={this.onClick}>
							<div className="txt">{name}</div>
						</div>
						<div className="archive">{translate('blockLinkArchived')}</div>
						<div className="linkCards">
							{cards.map((item: any, i: number) => (
								<LinkCard key={i} {...this.props} {...item} />
							))}
						</div>
					</React.Fragment>
				)}
			</div>
		);
	};

	onKeyDown (e: any) {
		const { onKeyDown } = this.props;

		if (onKeyDown) {
			onKeyDown(e, '', [], { from: 0, to: 0 });
		};
	};
	
	onKeyUp (e: any) {
		const { onKeyUp } = this.props;

		if (onKeyUp) {
			onKeyUp(e, '', [], { from: 0, to: 0 });
		};
	};

	onFocus () {
		const { block } = this.props;
		focus.set(block.id, { from: 0, to: 0 });
	};
	
	onClick (e: any) {
		const { rootId, block } = this.props;
		const { content } = block;
		const { targetBlockId } = content;
		const object = detailStore.get(rootId, targetBlockId, []);
		const { _empty_ } = object;
		
		if (!_empty_ && (targetBlockId != rootId)) {
			DataUtil.objectOpenEvent(e, object);
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

	onCheckbox () {
		const { rootId, block } = this.props;
		const { content } = block;
		const { targetBlockId } = content;
		const object = detailStore.get(rootId, targetBlockId, []);

		DataUtil.pageSetDone(targetBlockId, !object.done);
	};
	
});

export default BlockLink;