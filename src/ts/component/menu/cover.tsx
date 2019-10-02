import * as React from 'react';
import { observer, inject } from 'mobx-react';
import { Icon, Cover } from 'ts/component';

interface Props {
	commonStore?: any;
};

const SIZE = 7;

@inject('commonStore')
@observer
class MenuCover extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
	};
	
	render () {
		const { commonStore } = this.props;
		const { cover } = commonStore;
		
		let items: any[] = [];
		for (let i = 1; i <= SIZE; ++i) {
			items.push({ id: i });
		};
		
		const Item = (item: any) => (
			<div className="item" onMouseDown={(e) => { this.onClick(e, item.id); }}>
				<Cover num={item.id} />
				{item.id == cover ? <Icon /> : ''}
			</div>
		);
		
		return (
			<div className="items">
				{items.map((item: any, i) => (
					<Item key={i} {...item} />
				))}
			</div>
		);
	};
	
	onClick (e: any, id: number) {
		const { commonStore } = this.props;
		commonStore.coverSet(id);
	};
	
};

export default MenuCover;