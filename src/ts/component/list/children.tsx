import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Block } from 'ts/component';
import { blockStore } from 'ts/store';
import { observer } from 'mobx-react';
import { I, C, focus, translate } from 'ts/lib';

interface Props extends I.BlockComponent, RouteComponentProps<any> {
	onMouseMove? (e: any): void;
	onMouseLeave? (e: any): void;
	onResizeStart? (e: any, index: number): void;
};

const ListChildren = observer(class ListChildren extends React.Component<Props, {}> {
	
	refObj: any = {};

	constructor (props: any) {
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
					<div className="emptyToggle" onClick={this.onEmptyToggle}>
						{translate('blockTextToggleEmpty')}
					</div>
				);
			} else {
				return null;
			};
		};
		
		const className = String(this.props.className || '').replace(/first|last/g, '');
		const cn = [ 'children', (block.isTextToggle() ? 'canToggle' : '') ];
		
		let ColResize: any = (): any => null;
		let isRow = block.isLayoutRow();
		
		if (isRow) {
			ColResize = (item: any) => (
				<div className={[ 'colResize', 'c' + item.index ].join(' ')} onMouseDown={(e: any) => { onResizeStart(e, item.index); }}>
					<div className="inner">
						<div className="line" />
					</div>
				</div>
			);
		};

		console.log('LENGTH', length);

		return (
			<div id={'block-children-' + block.id} className={cn.join(' ')} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
				{children.map((item: any, i: number) => {
					let css: any = {};
					let cn = [];

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
						<React.Fragment key={item.id}>
							{(i > 0) && isRow ? <ColResize index={i} /> : ''}
							<Block 
								key={'block-' + item.id} 
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