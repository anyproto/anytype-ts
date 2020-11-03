import * as React from 'react';
import { I, DataUtil } from 'ts/lib';
import { Icon, Input, MenuItemVertical } from 'ts/component';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

@observer
class MenuOptionEdit extends React.Component<Props, {}> {
	
	constructor(props: any) {
		super(props);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { relation, id } = data;
		const { selectDict } = relation;
		const item = selectDict[id];
		const colors = DataUtil.menuGetBgColors();

		return (
			<div>
				<div className="wrap">
					<Input value={item.text} placeHolder="Option name"  />
				</div>
				<div className="item">
					<Icon className="remove" />
					<div className="name">Delete option</div>
				</div>
				<div className="line" />
				{colors.map((action: any, i: number) => {
					let inner = <div className={'inner bgColor bgColor-' + action.className} />;
					return <MenuItemVertical id={i} key={i} {...action} icon="color" inner={inner} className={action.value == item.color ? 'active' : ''} onClick={(e: any) => { this.onColor(e, action); }} />;
				})}
			</div>
		);
	};

	onColor (e: any, item: any) {
	};
	
};

export default MenuOptionEdit;