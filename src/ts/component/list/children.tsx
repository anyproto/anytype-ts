import * as React from 'react';
import { Block } from 'Component';
import { blockStore } from 'Store';
import { observer } from 'mobx-react';
import { DropTarget } from 'Component';
import { I, C, focus, translate } from 'Lib';

interface Props extends I.BlockComponent {
	onMouseMove? (e: any): void;
	onMouseLeave? (e: any): void;
	onResizeStart? (e: any, index: number): void;
};

const ListChildren = observer(class ListChildren extends React.Component<Props> {
	
	refObj: any = {};

	constructor (props: Props) {
		super(props);
		
		this.onEmptyToggle = this.onEmptyToggle.bind(this);
	};
	
	render () {
		const { onMouseMove, onMouseLeave, onResizeStart, rootId, block, index, readonly } = this.props;
		const childrenIds = blockStore.getChildrenIds(rootId, block.id);
		const children = blockStore.getChildren(rootId, block.id);
		const length = childrenIds.length;

		if (!length) {
			if (block.isTextToggle() && !readonly) {
				return (
					<DropTarget 
						{...this.props}
						className="emptyToggle"
						rootId={rootId} 
						id={block.id} 
						style={block.content.style} 
						type={block.type} 
						dropType={I.DropType.Block} 
						canDropMiddle={true} 
						onClick={this.onEmptyToggle} 
					>
						{translate('blockTextToggleEmpty')}
					</DropTarget>
				);
			} else {
				return null;
			};
		};
		
		const className = String(this.props.className || '').replace(/first|last/g, '');
		const cn = [ 'children', (block.isTextToggle() ? 'canToggle' : '') ];
		const isRow = block.isLayoutRow();

		let ColResize: any = (): any => null;
		
		if (isRow) {
			ColResize = (item: any) => (
				<div className={[ 'colResize', 'c' + item.index ].join(' ')} onMouseDown={e => onResizeStart(e, item.index)}>
					<div className="inner">
						<div className="line" />
					</div>
				</div>
			);
		};

		return (
			<div id={`block-children-${block.id}`} className={cn.join(' ')} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
				{children.map((item: any, i: number) => {
					const css: any = {};
					const cn = [];

					if (isRow) {
						css.width = (item.fields.width || 1 / length ) * 100 + '%';
					};

					if (className) {
						cn.push(className);
					};
					if (i == 0) {
						cn.push('first');
					};
					if (i == length - 1) {
						cn.push('last');
					};

					return (
						<React.Fragment key={`block-child-${item.id}`}>
							{(i > 0) && isRow ? <ColResize index={i} /> : ''}
							<Block 
								key={`block-${item.id}`} 
								{...this.props} 
								block={item} 
								css={css} 
								className={cn.join(' ')} 
								index={index + '-' + i} 
							/>
						</React.Fragment>
					);
				})}
			</div>
		);
	};

	onEmptyToggle (e: any) {
		const { rootId, block } = this.props;

		C.BlockCreate(rootId, block.id, I.BlockPosition.Inner, { type: I.BlockType.Text }, (message: any) => {
			focus.set(message.blockId, { from: 0, to: 0 });
			focus.apply();
		});
	};
	
});

export default ListChildren;