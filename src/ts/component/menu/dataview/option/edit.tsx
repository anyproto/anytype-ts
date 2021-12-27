import * as React from 'react';
import { I, DataUtil, Util, translate, keyboard } from 'ts/lib';
import { Icon, Filter, MenuItemVertical } from 'ts/component';
import { observer } from 'mobx-react';
import { observable } from 'mobx';
import { menuStore } from 'ts/store';

interface Props extends I.Menu {}

const $ = require('jquery');

const MenuOptionEdit = observer(class MenuOptionEdit extends React.Component<Props, {}> {
	
	refName: any = null;
	color: string = null;
	timeout: number = 0;
	n: number = -1;

	render () {
		const { param } = this.props;
		const { data } = param;
		const { option } = data;
		const relation = data.relation.get();
		const sections = this.getSections();

		const Section = (item: any) => (
			<div className="section">
				<div className="items">
					{item.children.map((action: any, i: number) => {
						if (action.isBgColor) {
							action.inner = <div className={`inner isTag textColor textColor-${action.className}`} />;
							action.icon = 'color';
							action.checkbox = action.value == this.color;
						};

						return (
							<MenuItemVertical 
								key={i} 
								{...action} 
								onClick={(e: any) => { this.onClick(e, action); }}
							/>
						);
					})}
				</div>
			</div>
		);

		return (
			<div>
				<Filter
					ref={(ref: any) => { this.refName = ref; }}
					placeholder={translate('menuDataviewOptionEditPlaceholder')}
					placeholderFocus={translate('menuDataviewOptionEditPlaceholder')}
					className={'textColor-' + this.color}
					value={option.text}
					onKeyUp={(e: any, v: string) => { this.onKeyUp(e, v); }}
				/>

				{sections.map((item: any, i: number) => (
					<Section key={i} {...item} />
				))}
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
		this.props.setActive();
	};

	componentWillUnmount () {
		this.unbind();
		window.clearTimeout(this.timeout);
	};

	focus () {
		window.setTimeout(() => { 
			if (this.refName) {
				this.refName.focus(); 
			};
		}, 15);
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', (e: any) => { this.onKeyDown(e); });
		window.setTimeout(() => { this.props.setActive(); }, 15);
	};
	
	unbind () {
		$(window).unbind('keydown.menu');
	};

	getSections () {
		return [
			{ children: DataUtil.menuGetBgColors() },
			{ 
				children: [
					{ id: 'remove', icon: 'remove', name: translate('menuDataviewOptionEditDelete') }
				] 
			},
		];
	};

	getItems () {
		const sections = this.getSections();
		
		let items: any[] = [];
		for (let section of sections) {
			items = items.concat(section.children);
		};
		
		return items;
	};

	onKeyDown (e: any) {
		window.clearTimeout(this.timeout);

		let ret = false;

		keyboard.shortcut('enter', e, (pressed: string) => {
			e.preventDefault();

			this.save();
			this.props.close();

			ret = true;
		});

		if (!ret) {
			this.props.onKeyDown(e);
		};
	};

	onKeyUp (e: any, v: string) {
		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => { this.save(); }, 500);
	};


	onClick (e: any, item: any) {
		if (item.isBgColor) {
			this.color = item.value;
			this.save();
			this.forceUpdate();
		} else
		if (item.id == 'remove') {
			this.remove();
		};
	};

	remove () {
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
		const value = this.refName.getValue();

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