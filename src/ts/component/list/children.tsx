import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Block } from 'ts/component';
import { blockStore } from 'ts/store';
import { observer } from 'mobx-react';
import { I, Util} from 'ts/lib';

interface Props extends RouteComponentProps<any> {
	rootId: string;
	block: any;
	index?: any;
	onMouseMove? (e: any): void;
	onMouseLeave? (e: any): void;
	onResizeStart? (e: any, index: number): void;
	getWrapperWidth?(): number;
	getWrapper?(): any;
}

const ListChildren = observer(class ListChildren extends React.Component<Props, {}> {
	
	refObj: any = {};
	
	render () {
		const { onMouseMove, onMouseLeave, onResizeStart, rootId, block, index } = this.props;
		const childrenIds = blockStore.getChildrenIds(rootId, block.id);
		const children = blockStore.getChildren(rootId, block.id);
		const length = childrenIds.length;

		if (!length) {
			return null;
		};
		
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
		
		return (
			<div id={'block-children-' + block.id} className={cn.join(' ')} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
				{children.map((item: any, i: number) => {
					let css: any = {};
					let cn = [];
					
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
						<React.Fragment key={item.id}>
							{(i > 0) && isRow ? <ColResize index={i} /> : ''}
							<Block {...this.props} block={item} css={css} className={cn.join(' ')} index={index + '-' + i} />
						</React.Fragment>
					);
				})}
			</div>
		);
	};
	
});

export default ListChildren;