import * as React from 'react';
import { I, C, DataUtil, Util, translate } from 'ts/lib';
import { Icon, Input, Filter, MenuItemVertical } from 'ts/component';
import { observer } from 'mobx-react';
import { observable } from 'mobx';
import { menuStore } from 'ts/store';

interface Props extends I.Menu {};

const $ = require('jquery');

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

		let prefix = '';
		switch (relation.format) {
			default:
				prefix = 'bgColor';
				break;

			case I.RelationType.Status:
				prefix = 'textColor';
				break;
		};

		return (
			<div>
				<div className="filter">
					<div className="inner">
						<Input 
							ref={(ref: any) => { this.ref = ref; }} 
							placeHolder={translate('menuDataviewOptionEditPlaceholder')} 
							onBlur={this.onSubmit} 
						/>
					</div>
					<div className="line" />
				</div>

				{colors.map((action: any, i: number) => {
					let inner = <div className={`inner ${prefix} ${prefix}-${action.className}`} />;
					return <MenuItemVertical id={i} key={i} {...action} icon="color" inner={inner} isActive={action.value == option.color} onClick={(e: any) => { this.onColor(e, action); }} />;
				})}

				<div className="line" />
				<div className="item" onClick={this.onRemove}>
					<Icon className="remove" />
					<div className="name">{translate('menuDataviewOptionEditDelete')}</div>
				</div>
			</div>
		);
	};

	componentDidMount () {
		const { param } = this.props;
		const { data } = param;
		const { option } = data;

		this.color = option.color;
		this.rebind();
	};

	componentDidUpdate () {
		const { param } = this.props;
		const { data } = param;
		const { option } = data;
	};

	componentWillUnmount () {
		const { param } = this.props;
		const { data } = param;
		const { rebind } = data;

		this.unbind();
		
		if (rebind) {
			rebind();
		};
	};

	rebind () {
		this.unbind();
	};
	
	unbind () {
		$(window).unbind('keydown.menu');
	};

	onSubmit (e: any) {
		e.preventDefault();

		const value = this.ref.getValue();
		if (!value) {
			return;
		};

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
		const { option, rootId, blockId, record, onChange, optionCommand } = data;
		const relation = data.relation.get();

		relation.selectDict = relation.selectDict.filter((it: any) => { return it.id != option.id; });
		optionCommand('delete', rootId, blockId, relation.relationKey, record.id, option);

		let value = Util.objectCopy(data.value || []);
		value = value.filter((it: any) => { return it != option.id; });
		value = Util.arrayUnique(value);

		this.props.param.data.value = value;

		const nd = { 
			value: value, 
			relation: observable.box(relation),
		};
		menuStore.updateData('dataviewOptionList', nd);
		menuStore.updateData('dataviewOptionValues', nd);
		
		onChange(value);
		close();
	};

	save () {
		const { param } = this.props;
		const { data } = param;
		const { option, rootId, blockId, record, optionCommand } = data;
		const relation = data.relation.get();
		const idx = relation.selectDict.findIndex((it: any) => { return it.id == option.id; });

		option.text = this.ref.getValue();
		option.color = this.color;

		if (!option.text) {
			return;
		};

		relation.selectDict[idx] = option;
		optionCommand('update', rootId, blockId, relation.relationKey, record.id, relation.selectDict[idx]);

		const nd = { relation: observable.box(relation) };
		this.props.param.data.option = option;

		menuStore.updateData('dataviewOptionList', nd);
		menuStore.updateData('dataviewOptionValues', nd);
	};
	
};

export default MenuOptionEdit;