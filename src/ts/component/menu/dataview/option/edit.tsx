import * as React from 'react';
import { I, C, DataUtil, Util, translate } from 'ts/lib';
import { Icon, Input, MenuItemVertical } from 'ts/component';
import { observer } from 'mobx-react';
import { observable } from 'mobx';
import { commonStore } from 'ts/store';

interface Props extends I.Menu {};

@observer
class MenuOptionEdit extends React.Component<Props, {}> {
	
	ref: any = null;
	color: string = null;

	constructor(props: any) {
		super(props);

		this.onSubmit = this.onSubmit.bind(this);
		this.onRemove = this.onRemove.bind(this);
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
					<Input ref={(ref: any) => { this.ref = ref; }} value={option.text} placeHolder={translate('menuDataviewOptionEditPlaceholder')}  />
				</form>
				<div className="item" onClick={this.onRemove}>
					<Icon className="remove" />
					<div className="name">{translate('menuDataviewOptionEditDelete')}</div>
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

	onRemove (e: any) {
		const { param, close } = this.props;
		const { data } = param;
		const { option, rootId, blockId, onChange } = data;
		const relation = data.relation.get();
		const { menus } = commonStore;
		const menu = menus.find((item: I.Menu) => { return item.id == 'dataviewOptionList'; });

		relation.selectDict = relation.selectDict.filter((it: any) => { return it.id != option.id; });
		C.BlockDataviewRelationSelectOptionDelete(rootId, blockId, relation.key, option.id);

		let value = Util.objectCopy(data.value || []);
		value = value.filter((it: any) => { return it != option.id; });
		value = Util.arrayUnique(value);

		onChange(value);

		if (menu) {
			menu.param.data.value = value;
			menu.param.data.relation = observable.box(relation);
			commonStore.menuUpdate('dataviewOptionList', menu.param);
		};
		
		close();
	};

	save () {
		const { param } = this.props;
		const { data } = param;
		const { option, rootId, blockId } = data;
		const relation = data.relation.get();
		const idx = relation.selectDict.findIndex((it: any) => { return it.text == option.text; });
		const { menus } = commonStore;
		const menu = menus.find((item: I.Menu) => { return item.id == 'dataviewOptionList'; });

		relation.selectDict[idx].text = this.ref.getValue();
		relation.selectDict[idx].color = this.color;
		C.BlockDataviewRelationSelectOptionUpdate(rootId, blockId, relation.key, relation.selectDict[idx]);

		if (menu) {
			menu.param.data.relation = observable.box(relation);
			commonStore.menuUpdate('dataviewOptionList', menu.param);
		};
	};
	
};

export default MenuOptionEdit;