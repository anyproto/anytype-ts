import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { MenuMain } from 'ts/component';
import { I, Util } from 'ts/lib'; 
import { observer, inject } from 'mobx-react';

interface Props extends RouteComponentProps<any> {
	blockStore?: any;
};

interface State {
};

@inject('blockStore')
@observer
class PageMainEdit extends React.Component<Props, State> {
	
	state = {
	};

	constructor (props: any) {
		super(props);
	};
	
	render () {
		const { blockStore } = this.props;
		const { blocks } = blockStore;
		const tree = Util.wrapTree('', blocks);
		
		const Block = (item: any) => (
			<div id={'block' + item.id} className="block">
				<div className="children">
					{item.children.map((child: any, i: number) => (
						<Block key={child.id} {...child} />
					))}
				</div>
			</div>
		);
		
		return (
			<div>
				<MenuMain />
				<div className="editor">
					{tree.map((item: I.Block, i: number) => ( 
						<Block key={item.id} {...item} />
					))}
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		const { blockStore } = this.props;
		
		blockStore.blockClear();
		for (let i = 0; i < 100; ++i) {
			blockStore.blockAdd({
				id: String(i + 1),
				parentId: '',
			});
		};
		
		for (let i = 0; i < 100; ++i) {
			blockStore.blockAdd({
				id: String(i + 101),
				parentId: String(Util.rand(0, 100)),
			});
		};
		
		for (let i = 0; i < 100; ++i) {
			blockStore.blockAdd({
				id: String(i + 201),
				parentId: String(Util.rand(101, 201)),
			});
		};
	};
	
};

export default PageMainEdit;