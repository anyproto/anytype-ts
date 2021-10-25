import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Icon, Loader } from 'ts/component';
import { I, DataUtil, translate } from 'ts/lib';
import { detailStore } from 'ts/store';
import { observer } from 'mobx-react';
import { focus } from 'ts/lib';

import LinkCard from './link/card';

interface Props extends I.BlockComponent, RouteComponentProps<any> {};

const $ = require('jquery');
const raf = require('raf');

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
		const { id, content, align } = block;
		const object = detailStore.get(rootId, content.targetBlockId);
		const { _empty_, isArchived, isDeleted, done, layout } = object;
		const cn = [ 'focusable', 'c' + id, 'resizable' ];
		const fields = DataUtil.checkLinkSettings(block.fields, layout);
		const readonly = this.props.readonly || object.isReadonly || object.templateIsBundled;

		if ((layout == I.ObjectLayout.Task) && done) {
			cn.push('isDone');
		};

		if (isArchived) {
			cn.push('isArchived');
		};

		let element = null;
		if (_empty_) {
			element = (
				<div className="loading" data-target-block-id={content.targetBlockId}>
					<Loader />
					<div className="name">{translate('blockLinkSyncing')}</div>
				</div>
			);
		} else 
		if (isDeleted) {
			element = (
				<div className="deleted" onClick={this.onClick}>
					<Icon className="ghost" />
					<div className="name">Deleted</div>
				</div>
			);
		} else {
			if (!isArchived) {
				cn.push('cp');
			};

			element = (
				<LinkCard 
					{...this.props} 
					{...fields}
					className={DataUtil.linkCardClass(fields.style)}
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
		node.unbind('resize');
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
		const { _empty_ , isArchived } = object;

		if (!_empty_ && !isArchived && (targetBlockId != rootId)) {
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

	resize () {
		const node = $(ReactDOM.findDOMNode(this));
		const card = node.find('.linkCard');
		const icon = node.find('.iconObject');

		icon.length ? card.addClass('withIcon') : card.removeClass('withIcon');
	};
	
});

export default BlockLink;