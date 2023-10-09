import * as React from 'react';
import $ from 'jquery';
import { Icon, Title, EmptySearch, PreviewObject, IconObject } from 'Component';
import { C, I, UtilObject, translate, UtilData, UtilCommon, keyboard } from 'Lib';
import { dbStore, menuStore, detailStore, commonStore } from 'Store';
import Constant from 'json/constant.json';
import { observer } from 'mobx-react';

const TEMPLATE_WIDTH = 236;
const PADDING = 16;

const MenuTemplateList = observer(class MenuTemplateList extends React.Component<I.Menu> {

	state = {
		loading: false
	};

	node: any = null;
	n = 0;
	typeId: string = '';

	constructor (props: I.Menu) {
		super(props);

		this.onClick = this.onClick.bind(this);
		this.onMore = this.onMore.bind(this);
		this.onType = this.onType.bind(this);
		this.setCurrent = this.setCurrent.bind(this);
		this.setHover = this.setHover.bind(this);
		this.getTemplateId = this.getTemplateId.bind(this);
		this.updateRowLength = this.updateRowLength.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.rebind = this.rebind.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { withTypeSelect, noTitle, typeId } = data;
		const previewSizesCns = [ 'small', 'medium', 'large' ];
		const previewSize = data.previewSize || I.PreviewSize.Small;
		const templateId = this.getTemplateId();
		const items = this.getItems();

		const type = dbStore.getTypeById(typeId);
		const isAllowed = UtilObject.isAllowedTemplate(typeId);

		const ItemBlank = (item: any) => (
			<div
				id={`item-${item.id}`}
				className={[ 'previewObject', previewSizesCns[previewSize], 'blank', (item.id == templateId ? 'isDefault' : '') ].join(' ')}
				onMouseEnter={e => this.setHover(e, item)}
				onMouseLeave={this.setHover}
			>
				<div
					id={`item-more-${item.id}`}
					className="moreWrapper"
					onClick={e => this.onMore(e, item)}
				>
					<Icon className="more" />
				</div>

				<div onClick={e => this.onClick(e, item)}>
					<div className="scroller">
						<div className="heading">
							<div className="name">{translate('commonBlank')}</div>
							<div className="featured" />
						</div>
					</div>
					<div className="border" />
				</div>
			</div>
		);

		const ItemNew = (item: any) => (
			<div
				id={`item-${item.id}`}
				className="previewObject small"
				onClick={e => this.onClick(e, item)}
				onMouseEnter={e => this.setHover(e, item)}
				onMouseLeave={this.setHover}
			>
				<div className="border" />
				<Icon className="add" />
			</div>
		);

		const Item = (item: any) => {
			let component = null;

			if (item.id == Constant.templateId.blank) {
				component = <ItemBlank {...item} />;
			} else
			if (item.id == Constant.templateId.new) {
				component = <ItemNew {...item} />;
			} else {
				component = (
					<PreviewObject
						className={item.id == templateId ? 'isDefault' : ''}
						rootId={item.id}
						size={previewSize}
						onClick={e => this.onClick(e, item)}
						onMouseEnter={e => this.setHover(e, item)}
						onMouseLeave={this.setHover}
						onMore={e => this.onMore(e, item)}
					/>
				);
			};

			return component;
		};

		return (
			<div ref={node => this.node = node}>
				{withTypeSelect ? (
					<div id="defaultType" className="select big defaultTypeSelect" onClick={this.onType}>
						<div className="item">
							<IconObject object={type} size={18} />
							<div className="name">{type?.name || translate('commonObjectType')}</div>	
						</div>
						<Icon className="arrow black" />
					</div>
				) : ''}

				{!noTitle ? <Title text={translate('commonTemplates')} /> : ''}

				{isAllowed ? (
					<div className="items">
						{items.map((item: any, i: number) => (
							<Item key={i} {...item} />
						))}
					</div>
				) : <EmptySearch text={translate('menuDataviewTemplateUnsupported')} />}
			</div>
		);
	};

	componentDidMount () {
		this.rebind();
		this.load();
	};

	componentDidUpdate (): void {
		this.resize();
		this.setCurrent();
	};

	componentWillUnmount () {
		C.ObjectSearchUnsubscribe([ this.getSubId() ]);
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', e => this.onKeyDown(e));
	};

	unbind () {
		$(window).off('keydown.menu');
	};

	onKeyDown (e: any) {
		const { param, close } = this.props;
		const { data } = param;
		const { onSelect } = data;
		const items = this.getItems();

		keyboard.shortcut('arrowup, arrowleft, arrowdown, arrowright', e, (arrow) => {
			e.preventDefault();

			switch (arrow) {
				case 'arrowup':
				case 'arrowleft': {
					this.n--;

					if (this.n < 0) {
						this.n = items.length - 1;
					};
					break;
				};

				case 'arrowdown':
				case 'arrowright': {
					this.n++;

					if (this.n > items.length - 1) {
						this.n = 0;
					};
					break;
				};
			};

			this.setHover(e, items[this.n]);
		});

		keyboard.shortcut('enter', e, () => {
			const item = items[this.n];

			this.onClick(e, item);
		});
	};

	setHover (e: any, item?: any) {
		const items = this.getItems();
		const node = $(this.node);

		node.find('.previewObject.hover').removeClass('hover');
		if (item) {
			this.n = items.findIndex(it => it.id == item.id);
			node.find('#item-' + item.id).addClass('hover');
		};
	};

	setCurrent () {
		const { param } = this.props;
		const { data } = param;
		const { templateId } = data;
		const items = this.getItems();

		this.n = items.findIndex(it => it.id == templateId);
		this.rebind();
	};

	load () {
		const { param } = this.props;
		const { data } = param;
		const { typeId } = data;
		const templateType = dbStore.getTemplateType();

		const filters: I.Filter[] = [
			{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: templateType?.id },
			{ operator: I.FilterOperator.And, relationKey: 'targetObjectType', condition: I.FilterCondition.In, value: typeId },
		];
		const sorts = [
			{ relationKey: 'name', type: I.SortType.Asc },
		];
		const keys = Constant.defaultRelationKeys.concat([ 'targetObjectType' ]);

		UtilData.searchSubscribe({
			subId: this.getSubId(),
			filters,
			sorts,
			keys,
			ignoreHidden: true,
			ignoreDeleted: true,
		}, this.setCurrent);
	};

	getSubId () {
		return [ this.props.getId(), 'data' ].join('-');
	};

	getTemplateId () {
		const { param } = this.props;
		const { data } = param;
		const { getView, templateId } = data;

		return (getView ? getView().defaultTemplateId || templateId : templateId) || Constant.templateId.blank;
	};

	getItems () {
		const { param } = this.props;
		const { data } = param;
		const { noAdd } = data;
		const subId = this.getSubId();
		const items = dbStore.getRecords(subId, '').map(id => detailStore.get(subId, id));

		items.unshift({ id: Constant.templateId.blank });

		if (!noAdd) {
			items.push({ id: Constant.templateId.new });
		};

		return items;
	};

	onMore (e: any, template: any) {
		const { param } = this.props;
		const { data } = param;
		const { onSetDefault, route, typeId } = data;
		const item = UtilCommon.objectCopy(template);
		const node = $(`#item-${item.id}`);
		const templateId = this.getTemplateId();

		e.preventDefault();
		e.stopPropagation();

		if (!item.targetObjectType) {
			item.targetObjectType = typeId;
		};

		if (menuStore.isOpen('dataviewTemplateContext', item.id)) {
			menuStore.close('dataviewTemplateContext');
			return;
		};

		menuStore.closeAll(Constant.menuIds.dataviewTemplate, () => {
			menuStore.open('dataviewTemplateContext', {
				menuKey: item.id,
				element: `#item-${item.id} #item-more-${item.id}`,
				vertical: I.MenuDirection.Bottom,
				horizontal: I.MenuDirection.Right,
				subIds: Constant.menuIds.dataviewTemplate,
				onOpen: () => {
					node.addClass('active');
				},
				onClose: () => {
					node.removeClass('active');
				},
				data: {
					rebind: this.rebind,
					template: item,
					isView: true,
					typeId,
					templateId,
					route,
					onDuplicate: (object) => UtilObject.openPopup(object, {}),
					onSetDefault,
				}
			});
		});
	};

	onClick (e: any, template: any) {
		const { param } = this.props;
		const { data } = param;
		const { onSelect, typeId } = data;
		const item = UtilCommon.objectCopy(template);

		if (!item.targetObjectType) {
			item.targetObjectType = typeId;
		};

		if (onSelect) {
			onSelect(item);
		};

		if (item.id != Constant.templateId.new) {
			data.templateId = item.id;
		};
	};

	onType () {
		const { getId, param } = this.props;
		const { data } = param;
		const { onTypeChange } = data;

		menuStore.open('typeSuggest', {
			element: `#${getId()} #defaultType`,
			horizontal: I.MenuDirection.Right,
			data: {
				rebind: this.rebind,
				filter: '',
				filters: [
					{ operator: I.FilterOperator.And, relationKey: 'recommendedLayout', condition: I.FilterCondition.In, value: UtilObject.getPageLayouts() },
				],
				onClick: (item) => {
					const type = dbStore.getTypeById(item.id);
					if (!type) {
						return;
					};

					window.setTimeout(() => {
						data.typeId = item.id;
						data.templateId = type.defaultTemplateId || Constant.templateId.blank;
						this.load();

						if (onTypeChange) {
							onTypeChange(item.id);
						};
					}, type.isInstalled ? 0 : 50);
				},
			}
		});
	};

	updateRowLength (n: number) {
		const node = $(this.node);
		const items = node.find('.items');

		items.css({ 'grid-template-columns': `repeat(${n}, 1fr)` });
	};

	resize () {
		const { param, getId } = this.props;
		const { data } = param;
		const { fromBanner } = data;

		if (!fromBanner) {
			return;
		};

		const sidebar = $('#sidebar');
		const { ww } = UtilCommon.getWindowDimensions();
		const sw = commonStore.isSidebarFixed && sidebar.hasClass('active') ? sidebar.outerWidth() : 0;
		const rows = Math.floor((ww - sw) / TEMPLATE_WIDTH);
		const obj = $(`#${getId()}`);
		const items = obj.find('.items');

		items.css({ 'grid-template-columns': `repeat(${rows}, 1fr)` });
	};

});

export default MenuTemplateList;
