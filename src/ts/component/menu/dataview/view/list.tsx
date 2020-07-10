import * as React from 'react';
import { I, C } from 'ts/lib';
import { Icon } from 'ts/component';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

@observer
class MenuViewList extends React.Component<Props, {}> {
	
	constructor(props: any) {
		super(props);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { view } = data;
		
		const items: any[] = [
			{ id: I.ViewType.Grid, name: 'Grid' },
			{ id: I.ViewType.List, name: 'List' },
			{ id: I.ViewType.Gallery, name: 'Gallery' },
			{ id: I.ViewType.Board, name: 'Kanban' },
		];
		
		const Item = (item: any) => (
			<div className={'item ' + (view.type == item.id ? 'active' : '')} onClick={(e: any) => { this.onClick(e, item.id); }}>
				<Icon className={'view c' + item.id} />
				<div className="name">{item.name}</div>
			</div>
		);
		
		return (
			<div className="section">
				<div className="name">View as</div>
				<div className="items">
					{items.map((item: any, i: number) => {
						return <Item key={i} {...item} />;
					})}
				</div>
			</div>
		);
	};
	
	onClick (e: any, id: number) {
		const { param } = this.props;
		const { data } = param;
		const { view, rootId, blockId } = data;

		this.props.close();
		C.BlockSetDataviewView(rootId, blockId, view.id, { ...view, type: id });
	};
	
};

export default MenuViewList;