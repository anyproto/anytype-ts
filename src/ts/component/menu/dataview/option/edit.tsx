import * as React from 'react';
import { I, DataUtil, Util, translate, keyboard } from 'ts/lib';
import { Icon, Filter, MenuItemVertical } from 'ts/component';
import { observer } from 'mobx-react';
import { observable } from 'mobx';
import { menuStore } from 'ts/store';

interface Props extends I.Menu {}

const $ = require('jquery');

const MenuOptionEdit = observer(class MenuOptionEdit extends React.Component<Props, {}> {
	
	ref: any = null;
	color: string = null;
	timeout: number = 0;

	constructor(props: any) {
		super(props);

		this.onRemove = this.onRemove.bind(this);
		this.onBlur = this.onBlur.bind(this);
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
				<Filter
					ref={(ref: any) => { this.ref = ref; }}
					placeholder={translate('menuDataviewOptionEditPlaceholder')}
					placeholderFocus={translate('menuDataviewOptionEditPlaceholder')}
					className={'textColor-' + this.color}
					value={option.text}
					onKeyUp={(e: any, v: string) => { this.onKeyUp(e, v); }}
					onBlur={this.onBlur}
				/>

				{colors.map((action: any, i: number) => {
					let inner = <div className={`inner ${prefix} ${prefix}-${action.className}`} />;
					return (
						<MenuItemVertical 
							id={i} 
							key={i} {...action} 
							icon="color" 
							inner={inner} 
							checkbox={action.value == option.color} 
							onClick={(e: any) => { this.onColor(e, action); }}
						/>
					);
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
		this.forceUpdate();
	};

	componentDidUpdate () {
		this.focus();
	};

	componentWillUnmount () {
		const { param } = this.props;
		const { data } = param;
		const { rebind } = data;

		this.unbind();
		window.clearTimeout(this.timeout);
		
		if (rebind) {
			rebind();
		};
	};

	focus () {
		window.setTimeout(() => { 
			if (this.ref) {
				this.ref.focus(); 
			};
		}, 15);
	};

	rebind () {
		this.unbind();
	};
	
	unbind () {
		$(window).unbind('keydown.menu');
	};

	onKeyUp (e: any, v: string) {
		e.preventDefault();

		const { close } = this.props;

		let ret = false;

		keyboard.shortcut('enter', e, (pressed: string) => {
			this.save();
			close();
		});

		if (ret) {
			return;
		};

		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => {
			this.save();
		}, 500);
	};

	onBlur () {
		window.clearTimeout(this.timeout);
		this.save();
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
		
		let value = DataUtil.getRelationArrayValue(data.value);
		value = value.filter((it: any) => { return it != option.id; });

		relation.selectDict = relation.selectDict.filter((it: any) => { return it.id != option.id; });
		optionCommand('delete', rootId, blockId, relation.relationKey, record.id, option);

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
		const value = this.ref.getValue();

		if (!value) {
			return;
		};

		option.text = value;
		option.color = this.color;

		relation.selectDict[idx] = option;
		optionCommand('update', rootId, blockId, relation.relationKey, record.id, relation.selectDict[idx]);

		const nd = { relation: observable.box(relation) };
		this.props.param.data.option = option;

		menuStore.updateData('dataviewOptionList', nd);
		menuStore.updateData('dataviewOptionValues', nd);
	};
	
});

export default MenuOptionEdit;