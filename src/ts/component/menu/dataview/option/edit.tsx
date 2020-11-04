import * as React from 'react';
import { I, DataUtil } from 'ts/lib';
import { Icon, Input, MenuItemVertical } from 'ts/component';
import { observer } from 'mobx-react';
import { observable } from 'mobx';
import { commonStore, dbStore } from 'ts/store';

interface Props extends I.Menu {};

@observer
class MenuOptionEdit extends React.Component<Props, {}> {
	
	ref: any = null;
	color: string = null;

	constructor(props: any) {
		super(props);

		this.onSubmit = this.onSubmit.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { option } = data;
		const relation = data.relation.get();
		const colors = DataUtil.menuGetBgColors();

		return (
			<div>
				<form className="wrap" onSubmit={this.onSubmit}>
					<Input ref={(ref: any) => { this.ref = ref; }} value={option.text} placeHolder="Option name"  />
				</form>
				<div className="item">
					<Icon className="remove" />
					<div className="name">Delete option</div>
				</div>
				<div className="line" />
				{colors.map((action: any, i: number) => {
					let inner = <div className={'inner bgColor bgColor-' + action.className} />;
					return <MenuItemVertical id={i} key={i} {...action} icon="color" inner={inner} className={action.value == option.color ? 'active' : ''} onClick={(e: any) => { this.onColor(e, action); }} />;
				})}
			</div>
		);
	};

	componentDidMount () {
		const { param } = this.props;
		const { data } = param;
		const { option } = data;

		this.color = option.color;
	};

	onSubmit (e: any) {
		e.preventDefault();

		this.save();
		this.props.close();
	};

	onColor (e: any, item: any) {
		this.color = item.value;
		this.save();
	};

	save () {
		const { param } = this.props;
		const { data } = param;
		const { option, blockId } = data;
		const relation = data.relation.get();
		const idx = relation.selectDict.findIndex((it: any) => { return it.text == option.text; });
		const { menus } = commonStore;
		const menu = menus.find((item: I.Menu) => { return item.id == 'dataviewOptionList'; });

		relation.selectDict[idx].text = this.ref.getValue();
		relation.selectDict[idx].color = this.color;

		menu.param.data.relation = observable.box(relation);
		commonStore.menuUpdate('dataviewOptionList', menu.param);

		dbStore.relationUpdate(blockId, relation);
		
		this.props.close();
	};
	
};

export default MenuOptionEdit;