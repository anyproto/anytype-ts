import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { MenuMain, Block, Smile, HeaderMainEdit as Header, DragLayer } from 'ts/component';
import { I, Util } from 'ts/lib'; 
import { observer, inject } from 'mobx-react';
import { DndProvider } from 'react-dnd';
import backend from 'ts/lib/dndBackend';

interface Props extends RouteComponentProps<any> {
	commonStore?: any;
	blockStore?: any;
};

const $ = require('jquery');

@inject('commonStore')
@inject('blockStore')
@observer
class PageMainEdit extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
	};
	
	render () {
		const { commonStore, blockStore, match } = this.props;
		const { tree } = blockStore;
		
		let n = 0;
		
		return (
			<div>
				<DndProvider backend={backend}>
					<DragLayer />
					
					<Header {...this.props} />
					<MenuMain />
						
					<div className="wrapper">
						<div className="editor">
							<div className="blocks">
								{tree.map((item: I.Block, i: number) => { 
									n = Util.incrementBlockNumber(item, n);
									return <Block key={item.header.id} {...item} number={n} index={i} />
								})}
							</div>
						</div>
					</div>
				</DndProvider>
			</div>
		);
	};
	
	componentDidMount () {
	};
	
	componentDidUpdate () {
	};
	
};

export default PageMainEdit;