import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, C, S, U, J, analytics, keyboard, translate, Action } from 'Lib';
import { MenuItemVertical } from 'Component';

const MenuNew = observer(class MenuNew extends React.Component<I.Menu> {

	n = -1;
	template: any = null;

	constructor (props: I.Menu) {
		super(props);

		this.rebind = this.rebind.bind(this);
	};

	render () {
		const sections = this.getSections();

		const Section = (item: any) => (
			<div id={'section-' + item.id} className="section">
				{item.name ? <div className="name">{item.name}</div> : ''}
				<div className="items">
					{item.children.map((action: any, i: number) => (
						<MenuItemVertical
							key={i}
							{...action}
							icon={action.icon}
							onMouseEnter={e => this.onMouseEnter(e, action)}
							onMouseLeave={e => this.onMouseLeave(e, action)}
							onClick={e => this.onClick(e, action)}
						/>
					))}
				</div>
			</div>
		);

		return (
			<div>
				{sections.map((item: any, i: number) => (
					<Section key={i} index={i} {...item} />
				))}
			</div>
		);
	};

	componentDidMount () {
		const { param } = this.props;
		const { data } = param;

		this.forceUpdate();
		this.rebind();
		this.loadTemplate();

		window.setTimeout(() => this.resize(), 5);
	};

	componentDidUpdate () {
		this.resize();
		this.props.setActive();
	};

	componentWillUnmount () {
		this.unbind();

		S.Menu.closeAll(J.Menu.dataviewNew);
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', e => this.props.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
	};

	unbind () {
		$(window).off('keydown.menu');
	};

	loadTemplate () {
		const { param } = this.props;
		const { data } = param;
		const { templateId } = data;

		U.Object.getById(templateId, {}, (object: any) => {
			this.template = object ? object : null;
			this.forceUpdate();
		});
	};

	getSections () {
		const { param } = this.props;
		const { data } = param;
		const { typeId, withTypeSelect } = data;
		const type = S.Record.getTypeById(typeId);
		const templateName = this.template ? this.template.name : translate('commonBlank');

		const itemsAdd = [
			{ id: 'new', icon: 'add', name: translate('commonNew') },
			{ id: 'existing', icon: 'existingObject', name: translate('menuDataviewExistingObject'), arrow: true },
		];
		const itemsSettings = [
			withTypeSelect ? { id: 'type', name: translate('commonDefaultType'), arrow: true, caption: type.name } : '',
			{ id: 'template', name: translate('commonTemplate'), arrow: true, caption: templateName },
		];

		let sections: any[] = [
			{ id: 'add', name: '', children: itemsAdd },
			{ id: 'settings', name: translate('commonSettings'), children: itemsSettings },
		].filter(it => it);

		sections = sections.map((s: any) => {
			s.children = s.children.filter(it => it);
			return s;
		}).filter(s => !!s.children.length);

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

	onMouseEnter (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
			this.onOver(e, item);
		};
	};

	onOver (e: any, item: any) {
		if (!item.arrow) {
			S.Menu.closeAll(J.Menu.dataviewNew);
			return;
		};

		const { param, getId, getSize, close } = this.props;
		const { data } = param;
		const { rootId, subId, blockId, typeId, templateId, route, hasSources, getView, onTypeChange, onSetDefault, onSelect } = data;
		const allowedLayouts = U.Object.getPageLayouts().concat(U.Object.getSetLayouts());

		const menuParam: I.MenuParam = {
			element: `#${getId()} #item-${item.id}`,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			isSub: true,
			className: param.className,
			classNameWrap: param.classNameWrap,
			data: {
				rootId,
				blockId,
				hasSources,
				getView,
				typeId,
				templateId,
				route,
			},
		};

		let menuId = '';
		switch (item.id) {
			case 'existing': {
				menuId = 'searchObject';
				menuParam.className = 'single';
				menuParam.data = Object.assign(menuParam.data, {
					filters: [
						{ relationKey: 'isReadonly', condition: I.FilterCondition.NotEqual, value: true },
					],
					onSelect: (el: any) => {
						Action.addToCollection(rootId, [ el.id ]);
					},
					skipIds: [ ...S.Record.getRecordIds(subId, ''), rootId ],
				});
				break;
			};
			case 'type': {
				menuId = 'typeSuggest';
				menuParam.data = Object.assign(menuParam.data, {
					filter: '',
					filters: [
						{ relationKey: 'recommendedLayout', condition: I.FilterCondition.In, value: allowedLayouts },
						{ relationKey: 'uniqueKey', condition: I.FilterCondition.NotEqual, value: J.Constant.typeKey.template },
					],
					skipIds: [ typeId ],
					onClick: type => {
						data.typeId = type.id;
						data.templateId = type.defaultTemplateId || J.Constant.templateId.blank;

						this.loadTemplate();

						if (onTypeChange) {
							onTypeChange(type.id);
						};
					},
				});
				break;
			};
			case 'template': {
				const update = (item) => {
					data.templateId = item.id;
					this.loadTemplate();
				};

				menuId = 'dataviewTemplateList';
				menuParam.data = Object.assign(menuParam.data, {
					onSetDefault: (item) => {
						update(item);

						if (onSetDefault) {
							onSetDefault(item);
						};
					},
					onSelect: (item) => {
						update(item);

						if (onSelect) {
							onSelect(item);
						};
					},
				});
				break;
			};
		};

		if (menuId && !S.Menu.isOpen(menuId, item.id)) {
			S.Menu.closeAll(J.Menu.dataviewNew, () => {
				S.Menu.open(menuId, menuParam);
			});
		};
	};

	onMouseLeave (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setHover(null, false);
		};
	};

	onClick (e: any, item: any) {
		if (item.arrow) {
			return;
		};

		const { param } = this.props;
		const { data } = param;
		const { onSelect } = data;

		switch (item.id) {
			case 'new': {
				if (onSelect) {
					onSelect(this.template ? this.template : { id: J.Constant.templateId.blank });
				};
				break;
			};
		};
	};

	resize () {
		const { getId, position } = this.props;
		const obj = $(`#${getId()} .content`);

		obj.css({ height: 'auto' });
		position();
	};

});

export default MenuNew;
