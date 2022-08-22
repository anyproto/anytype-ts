import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Icon, Loader } from 'Component';
import { I, DataUtil, translate, keyboard } from 'Lib';
import { detailStore, blockStore } from 'Store';
import { observer } from 'mobx-react';
import { focus } from 'Lib';

import LinkCard from './link/card';

interface Props extends I.BlockComponent, RouteComponentProps<any> {};

const $ = require('jquery');

const BlockLink = observer(class BlockLink extends React.Component<Props, {}> {
	
	_isMounted: boolean = false;

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
		const { rootId, block } = this.props;
		const object = detailStore.get(rootId, block.content.targetBlockId);
		const { _empty_, isArchived, isDeleted, done, layout } = object;
		const cn = [ 'focusable', 'c' + block.id, 'resizable' ];
		const content = DataUtil.checkLinkSettings(block.content, layout);
		const readonly = this.props.readonly || !blockStore.isAllowed(object.restrictions, [ I.RestrictionObject.Details ]);

		if ((layout == I.ObjectLayout.Task) && done) {
			cn.push('isDone');
		};

		if (isArchived) {
			cn.push('isArchived');
		};

		let element = null;
		if (_empty_) {
			element = (
				<div className="loading" data-target-block-id={object.id}>
					<Loader />
					<div className="name">{translate('blockLinkSyncing')}</div>
				</div>
			);
		} else 
		if (isDeleted) {
			element = (
				<div className="deleted">
					<Icon className="ghost" />
					<div className="name">{translate('commonDeletedObject')}</div>
				</div>
			);
		} else {
			if (!isArchived) {
				cn.push('cp');
			};
			if (content.cardStyle == I.LinkCardStyle.Card) {
				cn.push('br');
			};

			element = (
				<LinkCard 
					{...this.props} 
					{...content}
					object={object} 
					canEdit={!readonly && !isArchived} 
					onClick={this.onClick}
					onSelect={this.onSelect} 
					onUpload={this.onUpload}
					onCheckbox={this.onCheckbox} 
				/>
			);
		};

		return (
			<div className={cn.join(' ')} tabIndex={0} onKeyDown={this.onKeyDown} onKeyUp={this.onKeyUp} onFocus={this.onFocus}>
				{element}
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
		this.resize();
		this.rebind();
	};
	
	componentDidUpdate () {
		this.resize();
		this.rebind();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};

	rebind () {
		if (!this._isMounted) {
			return;
		};
		
		this.unbind();
		const node = $(ReactDOM.findDOMNode(this));
		node.on('resize', (e: any) => { this.resize(); });
	};
	
	unbind () {
		if (!this._isMounted) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		node.off('resize');
	};

	onKeyDown (e: any) {
		const { onKeyDown } = this.props;

		if (onKeyDown) {
			onKeyDown(e, '', [], { from: 0, to: 0 }, this.props);
		};
	};
	
	onKeyUp (e: any) {
		const { onKeyUp } = this.props;

		if (onKeyUp) {
			onKeyUp(e, '', [], { from: 0, to: 0 }, this.props);
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
		const { _empty_ , isArchived } = object;

		if (keyboard.withCommand(e) || _empty_ || isArchived || (targetBlockId == rootId)) {
			return;
		};

		DataUtil.objectOpenEvent(e, object);
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

	resize () {
		const { getWrapperWidth } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		const card = node.find('.linkCard');
		const icon = node.find('.iconObject');
		const rect = node.get(0).getBoundingClientRect() as DOMRect;

		const width = rect.width;
		const mw = getWrapperWidth();

		icon.length ? card.addClass('withIcon') : card.removeClass('withIcon');
		width <= mw / 2 ? card.addClass('vertical') : card.removeClass('vertical');
	};
	
});

export default BlockLink;