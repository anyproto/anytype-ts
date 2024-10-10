import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { MenuItemVertical } from 'Component';
import { I, C, S, U, keyboard, translate } from 'Lib';

const MenuDataviewDate = observer(class MenuDataviewDate extends React.Component<I.Menu> {

	_isMounted = false;
	n = -1;

	constructor (props: I.Menu) {
		super(props);

		this.rebind = this.rebind.bind(this);
	};

	render () {
		const sections = this.getSections();

		const Section = (item: any) => (
			<div>
				{item.name ? <div className="sectionName">{item.name}</div> : ''}
				<div className="items">
					{item.children.map((action: any, i: number) => (
						<MenuItemVertical 
							key={i} 
							{...action} 
							onMouseEnter={e => this.onMouseEnter(e, action)} 
						/>
					))}
				</div>
			</div>
		);

		return (
			<div className="items">
				{sections.map((item: any, i: number) => (
					<Section key={i} {...item} />
				))}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.rebind();
	};

	componentDidUpdate () {
		this.props.setActive();
		this.props.position();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', e => this.props.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};

	getSections () {
		const { param } = this.props;
		const { data } = param;
		const { getView, relationId } = data;
		const relation = S.Record.getRelationById(relationId);
		const dateOptions = this.getOptions('dateFormat');
		const timeOptions = this.getOptions('timeFormat');

		if (!relation) {
			return [];
		};

		let df = null;
		let tf = null;
		let dateFormat = null;
		let timeFormat = null;

		if (getView) {
			const view = getView();
			const vr = view.getRelation(relation.relationKey);

			if (vr) {
				df = vr.dateFormat;
				tf = vr.timeFormat;
			};
		} else {
			df = relation.dateFormat;
			tf = relation.timeFormat;
		};

		dateFormat = dateOptions.find(it => it.id == df) || dateOptions[0];
		timeFormat = timeOptions.find(it => it.id == tf) || timeOptions[0];

		let sections = [
			{ 
				id: 'date', name: translate('menuDataviewDateDateFormat'), children: [
					{ id: 'dateFormat', name: dateFormat?.name, arrow: true }
				] 
			},
			{ 
				id: 'time', name: translate('menuDataviewDateTimeFormat'), children: [
					{ id: 'timeFormat', name: timeFormat?.name, arrow: true }
				] 
			},
		];

		sections = U.Menu.sectionsMap(sections);
		return sections;
	};
	
	getItems () {
		const sections = this.getSections();
		
		let items: any[] = [];
		for (const section of sections) {
			items = items.concat(section.children);
		};
		
		return items;
	};

	getOptions (key: string) {
		let options: any[] = [];
		switch (key) {
			case 'dateFormat': {
				options = U.Menu.dateFormatOptions();
				break;
			};

			case 'timeFormat': {
				options = U.Menu.timeFormatOptions();
				break;
			};
		};
		return options;
	};
	
	onOver (e: any, item: any) {
		const { param, getId, getSize, close } = this.props;
		const { data, classNameWrap } = param;
		const { rootId, blockId, relationKey, getView } = data;
		const options = this.getOptions(item.itemId);

		let relation = null;
		let view = null;
		let value = null;

		if (getView) {
			view = getView();
			relation = view.getRelation(relationKey);
		} else {
			relation = S.Record.getRelationByKey(relationKey);
		};

		if (relation) {
			value = options.find(it => it.id == relation[item.itemId]);
		} else if (options.length) {
			value = options[0];
		};

		S.Menu.open('select', {
			element: `#${getId()} #item-${item.id}`,
			offsetX: getSize().width,
			offsetY: -38,
			isSub: true,
			passThrough: true,
			classNameWrap,
			data: {
				rebind: this.rebind,
				value: value.id,
				options,
				onSelect: (e: any, el: any) => {
					if (view) {
						relation[item.itemId] = el.id;
						C.BlockDataviewViewRelationReplace(rootId, blockId, view.id, relationKey, relation);
					};
					close();
				}
			}
		});
	};

	onMouseEnter (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
			this.onOver(e, item);
		};
	};

});

export default MenuDataviewDate;