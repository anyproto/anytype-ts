import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Block } from 'ts/component';
import { observer, inject } from 'mobx-react';
import { dispatcher, I, Util} from 'ts/lib';

interface Props extends I.Block, RouteComponentProps<any> {
	blockStore?: any;
	onMouseMove? (e: any): void;
	onMouseLeave? (e: any): void;
	onResizeStart? (e: any, index: number): void;
};

@inject('blockStore')
@observer
class ListChildren extends React.Component<Props, {}> {
	
	refObj: any = {};
	
	render () {
		const { onMouseMove, onMouseLeave, onResizeStart, childBlocks, type, content } = this.props;
		const { style } = content;
		
		let ColResize: any = (): any => null;
		
		if ((type == I.BlockType.Layout) && (style == I.LayoutStyle.Row)) {
			ColResize = (item: any) => (
				<div className={[ 'colResize', 'c' + item.index ].join(' ')} onMouseDown={(e: any) => { onResizeStart(e, item.index); }}>
					<div className="inner" />
				</div>
			);
		};
		
		return (
			<div className="children" onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
				{childBlocks.map((item: any, i: number) => {
					return (
						<React.Fragment key={item.id}>
							{i > 0 ? <ColResize index={i} /> : ''}
							<Block ref={(ref: any) => this.refObj[item.id] = ref} {...this.props} {...item} index={i} />
						</React.Fragment>
					);
				})}
			</div>
		);
	};
	
};

export default ListChildren;