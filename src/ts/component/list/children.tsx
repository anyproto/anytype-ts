import React, { forwardRef } from 'react';
import { Block } from 'Component';
import { observer } from 'mobx-react';
import { DropTarget } from 'Component';
import { I, C, S, focus, translate } from 'Lib';

interface Props extends I.BlockComponent {
	onMouseMove? (e: any): void;
	onMouseLeave? (e: any): void;
	onResizeStart? (e: any, index: number): void;
};

const ListChildren = observer(forwardRef<{}, Props>((props, ref) => {
	const {
		rootId = '',
		block,
		index = 0,
		readonly = false,
		className = '',
		onMouseMove,
		onMouseLeave,
		onResizeStart,
	} = props;

	const childrenIds = S.Block.getChildrenIds(rootId, block.id);
	const children = S.Block.getChildren(rootId, block.id);
	const length = childrenIds.length;

	const onEmptyToggle = (e: any) => {
		C.BlockCreate(rootId, block.id, I.BlockPosition.Inner, { type: I.BlockType.Text }, (message: any) => {
			focus.set(message.blockId, { from: 0, to: 0 });
			focus.apply();
		});
	};

	if (!length) {
		if (block.isTextToggle() && !readonly) {
			return (
				<DropTarget 
					{...props}
					className="emptyToggle"
					rootId={rootId} 
					id={block.id} 
					style={block.content.style} 
					type={block.type} 
					dropType={I.DropType.Block} 
					canDropMiddle={true} 
					onClick={onEmptyToggle} 
					cacheKey="emptyToggle"
				>
					{translate('blockTextToggleEmpty')}
				</DropTarget>
			);
		} else {
			return null;
		};
	};
	
	const c = String(className || '').replace(/first|last/g, '');
	const cn = [ 'children', (block.isTextToggle() ? 'canToggle' : '') ];
	const isRow = block.isLayoutRow();

	let ColResize: any = (): any => null;
	
	if (isRow) {
		ColResize = (item: any) => (
			<div className={[ 'colResize', 'c' + item.index ].join(' ')}>
				<div className="inner" onMouseDown={e => onResizeStart(e, item.index)} onDragStart={e => e.stopPropagation()}>
					<div className="line" />
				</div>
			</div>
		);
	};

	return (
		<div 
			id={`block-children-${block.id}`} 
			className={cn.join(' ')} 
			onMouseMove={onMouseMove} 
			onMouseLeave={onMouseLeave}
		>
			{children.map((item: any, i: number) => {
				const css: any = {};
				const cn = [ c ];

				if (isRow) {
					css.width = (item.fields.width || 1 / length ) * 100 + '%';
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
							{...props} 
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

}));

export default ListChildren;