import * as React from 'react';
import { I, focus, DataUtil, Util } from 'ts/lib';
import { blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.BlockComponent {};

const BlockTableOfContents = observer(class BlockTableOfContents extends React.Component<Props, {}> {

	_isMounted: boolean = false;

	constructor (props: any) {
		super(props);
		
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onFocus = this.onFocus.bind(this);
	};

	render () {
		const { rootId, block } = this.props;
		const childrenIds = blockStore.getChildrenIds(rootId, rootId);
		const blocks = blockStore.getBlocks(rootId);
		const cn = [ 'wrap', 'focusable', 'c' + block.id ];

		// Subscriptions
		for (let block of blocks) {
			const childrenIds = blockStore.getChildrenIds(rootId, block.id);
			const { style, text } = block.content;
		};

		let n = 0;

		const Item = (item: any) => {
			const block = blockStore.getLeaf(rootId, item.id);
			const childrenIds = blockStore.getChildrenIds(rootId, item.id);
			const cni = [ 'item', DataUtil.blockClass(block) ];

			if (!block) {
				return null;
			};

			let content = null;
			if (block.isTextHeader()) {
				const text = block.content.text;
				if (text) {
					cni.push(n % 2 ? 'even' : 'odd');

					content = (
						<div className="text" onClick={(e: any) => { this.onClick(e, block.id); }}>
							<span>{text}</span>
						</div>
					);
					n++;
				};
			};

			if (!content && !childrenIds.length) {
				return null;
			};

			return (
				<div className={cni.join(' ')}>
					{content}

					<div className="children">
						{childrenIds.map((id: string, i: number) => {
							return (
								<Item key={i} id={id} depth={item.depth + 1} />
							);
						})}
					</div>
				</div>
			);
		};

		return (
			<div className={cn.join(' ')} tabIndex={0} onKeyDown={this.onKeyDown} onKeyUp={this.onKeyUp} onFocus={this.onFocus}>
				{childrenIds.map((id: string, i: number) => {
					return (
						<Item key={i} id={id} depth={0} />
					);
				})}
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

	onClick (e: any, id: string) {
		const { isPopup } = this.props;
		const node = $('.focusable.c' + id);

		if (!node.length) {
			return;
		};

		const container = Util.getScrollContainer(isPopup);
		const no = node.offset().top;
		const st = container.scrollTop();
		const hh = Util.sizeHeader();
		const y = (isPopup ? (no - container.offset().top + st) : no) - hh;

		container.scrollTop(y);
	};
	
});

export default BlockTableOfContents;