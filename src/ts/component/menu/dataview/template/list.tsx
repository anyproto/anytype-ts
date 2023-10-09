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
	items: any = [];
	typeId: string = '';

	constructor (props: I.Menu) {
		super(props);

		this.onClick = this.onClick.bind(this);
		this.onMore = this.onMore.bind(this);
		this.onType = this.onType.bind(this);
		this.getTemplateId = this.getTemplateId.bind(this);
		this.updateRowLength = this.updateRowLength.bind(this);
		this.setCurrent = this.setCurrent.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.rebind = this.rebind.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { withTypeSelect, noAdd, noTitle, typeId } = data;
		const previewSizesCns = [ 'small', 'medium', 'large' ];
		const previewSize = data.previewSize || I.PreviewSize.Small;
		const templateId = this.getTemplateId();
		const items = this.getItems();

		const type = dbStore.getTypeById(typeId);
		const itemBlank = { id: Constant.templateId.blank, targetObjectType: typeId };
		const itemAdd = { id: Constant.templateId.new, targetObjectType: typeId };
		const isAllowed = UtilObject.isAllowedTemplate(typeId);

		const ItemBlank = () => (
			<div
				id={`item-${Constant.templateId.blank}`}
				className={[ 'previewObject', previewSizesCns[previewSize], 'blank', (Constant.templateId.blank == templateId ? 'isDefault' : '') ].join(' ')}
			>
				<div
					id={`item-more-${Constant.templateId.blank}`}
					className="moreWrapper"
					onClick={e => this.onMore(e, itemBlank)}
				>
					<Icon className="more" />
				</div>

				<div onClick={e => this.onClick(e, itemBlank)}>
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
            			<ItemBlank />

						{items.map((item: any, i: number) => (
							<PreviewObject
								key={i}
								className={item.id == templateId ? 'isDefault' : ''}
								rootId={item.id}
								size={previewSize}
								onClick={e => this.onClick(e, item)}
								onMore={e => this.onMore(e, item)}
							/>
						))}

						{!noAdd ? (
							<div className="previewObject small" onClick={e => this.onClick(e, itemAdd)}>
								<div className="border" />
								<Icon className="add" />
							</div>
						) : ''}
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
	};

	componentWillUnmount () {
		C.ObjectSearchUnsubscribe([ this.getSubId() ]);
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.templateList', e => this.onKeyDown(e));
	};

	unbind () {
		$(window).off('keydown.templateList');
	};

	onKeyDown (e: any) {
		const { param, close } = this.props;
		const { data } = param;
		const { typeId, onSelect } = data;
		const items = this.getItems();

		keyboard.shortcut('arrowup, arrowleft, arrowdown, arrowright', e, () => {
			e.preventDefault();

			console.log('KEY: ', e.key)
			console.log('E: ', e)

			switch (e.type) {
				case 'arrowup':
				case 'arrowleft': {
					e.key = 'arrowup';

					this.n--;

					console.log('UP')

					if (this.n < 0) {
						this.n = items.length;
					};
					break;
				};

				case 'arrowdown':
				case 'arrowright': {
					e.key = 'arrowdown';

					this.n++;
					console.log('DOWN')

					if (this.n > items.length) {
						this.n = 0;
					};
					break;
				};
			};

			let item = { id: Constant.templateId.blank, targetObjectType: typeId };

			if (this.n > 0) {
				item = items[this.n - 1];
			};
			console.log('N: ', this.n)
			console.log('ITEM: ', item)

			if (onSelect) {
				onSelect(item);
			};

			data.templateId = item.id;
		});
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

	setCurrent () {
		const { param } = this.props;
		const { data } = param;
		const { templateId } = data;
		const items = this.getItems();

		this.n = 0;

		const idx = items.findIndex(it => it.id == templateId);
		this.n = Number(idx) + 1;

		this.rebind();
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
		const subId = this.getSubId();
		return dbStore.getRecords(subId, '').map(id => detailStore.get(subId, id));
	};

	onMore (e: any, item: any) {
		const { param } = this.props;
		const { data } = param;
		const { onSetDefault, route, typeId } = data;
		const node = $(`#item-${item.id}`);
		const templateId = this.getTemplateId();

		e.preventDefault();
		e.stopPropagation();

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

	onClick (e: any, item: any) {
		const { param } = this.props;
		const { data } = param;
		const { onSelect } = data;

		if (onSelect) {
			onSelect(item);
		};

		data.templateId = item.id;
	};

	onType () {
		const { getId, param } = this.props;
		const { data } = param;
		const { onTypeChange } = data;

		menuStore.open('typeSuggest', {
			element: `#${getId()} #defaultType`,
			horizontal: I.MenuDirection.Right,
			data: {
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
