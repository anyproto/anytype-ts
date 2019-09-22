import * as React from 'react';
import { Menu } from 'ts/component';
import { observer, inject } from 'mobx-react';

interface Props {
	commonStore?: any;
};
interface State {};

@inject('commonStore')
@observer
class ListMenu extends React.Component<Props, State> {

	constructor (props: any) {
		super(props);
	};
	
	render () {
		const { commonStore } = this.props;
		const { menus } = commonStore;
		
		let dimmer = null;
		if (menus.length) {
			dimmer = <div className="dimmer" onMouseDown={() => { commonStore.menuCloseAll(); }} />;
		};
		
		return (
			<div className="menus">
				{menus.map((item: any, i: number) => (
					<Menu key={item.id} {...item} />
				))}
				{dimmer}
			</div>
		);
	};
	
};

export default ListMenu;