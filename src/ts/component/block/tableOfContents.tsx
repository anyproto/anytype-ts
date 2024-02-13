import * as React from 'react';
import { I, focus, UtilObject, UtilCommon, translate } from 'Lib';
import { blockStore } from 'Store';
import { observer } from 'mobx-react';

const BlockTableOfContents = observer(class BlockTableOfContents extends React.Component<I.BlockComponent> {

	_isMounted = false;

	constructor (props: I.BlockComponent) {
		super(props);
		
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onFocus = this.onFocus.bind(this);
	};

	render () {
		const { block } = this.props;
		const cn = [ 'wrap', 'focusable', 'c' + block.id ];
		const tree = this.getTree();

		const Item = (item: any) => {
			return (
				<div 
					className="item" 
					onClick={e => this.onClick(e, item.id)}
					style={{ paddingLeft: item.depth * 24 }}
				>
					<span>{item.text}</span>
				</div>
			);
		};

		return (
			<div className={cn.join(' ')} tabIndex={0} onKeyDown={this.onKeyDown} onKeyUp={this.onKeyUp} onFocus={this.onFocus}>
				{!tree.length ? (
					<div className="empty">{translate('blockTableOfContentsAdd')}</div>
				) : (
					<React.Fragment>
						{tree.map((item: any, i: number) => (
							<Item key={i} {...item} />
						))}
					</React.Fragment>
				)}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
	};
	
	componentWillUnmount () {
		this._isMounted = false;
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
		focus.set(this.props.block.id, { from: 0, to: 0 });
	};

	getTree () {
		const { rootId } = this.props;
		const blocks = blockStore.unwrapTree([ blockStore.wrapTree(rootId, rootId) ]).filter(it => it.isTextHeader());
		const list: any[] = [];

		let hasH1 = false;
		let hasH2 = false;

		blocks.forEach((block: I.Block) => {
			let depth = 0;

			if (block.isTextHeader1()) {
				depth = 0;
				hasH1 = true;
				hasH2 = false;
			};

			if (block.isTextHeader2()) {
				hasH2 = true;
				if (hasH1) depth++;
			};

			if (block.isTextHeader3()) {
				if (hasH1) depth++;
				if (hasH2) depth++;
			};

			list.push({ 
				depth, 
				id: block.id,
				text: String(block.content.text || translate('defaultNamePage')),
			});
		});
		return list;
	};

	onClick (e: any, id: string) {
		const { isPopup } = this.props;
		const node = $('.focusable.c' + id);

		if (!node.length) {
			return;
		};

		const container = UtilCommon.getScrollContainer(isPopup);
		const no = node.offset().top;
		const st = container.scrollTop();
		const hh = UtilCommon.sizeHeader();
		const y = Math.max(hh + 20, (isPopup ? (no - container.offset().top + st) : no) - hh - 20);

		container.scrollTop(y);
	};
	
});

export default BlockTableOfContents;