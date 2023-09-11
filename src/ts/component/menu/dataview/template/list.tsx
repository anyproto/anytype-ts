import * as React from 'react';
import $ from 'jquery';
import { Icon, Title, EmptySearch, PreviewObject, IconObject } from 'Component';
import { I, UtilObject, translate, UtilData } from 'Lib';
import { dbStore, menuStore } from 'Store';
import Constant from 'json/constant.json';

class MenuTemplateList extends React.Component<I.Menu> {

	state = {
		isLoading: false,
		templateId: ''
	};

	n = -1;
	items: any = [];
	typeId: string = '';

	constructor (props: I.Menu) {
		super(props);

		this.onClick = this.onClick.bind(this);
		this.onMore = this.onMore.bind(this);
		this.onType = this.onType.bind(this);
		this.reload = this.reload.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { withTypeSelect, typeId } = data;

		const type = dbStore.getType(typeId);
		const itemBlank = { id: Constant.templateId.blank, targetObjectType: typeId };
		const itemAdd = { id: Constant.templateId.new, targetObjectType: typeId };
		const isAllowed = UtilObject.isAllowedTemplate(typeId);

		const ItemBlank = () => (
			<div
				id={`item-${Constant.templateId.blank}`}
				className={[ 'previewObject', 'small', 'blank', (this.isDefaultTemplate('') ? 'isDefault' : '') ].join(' ')}
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
			<React.Fragment>

				{withTypeSelect ? (
					<div id="defaultType" className="select big defaultTypeSelect" onClick={this.onType}>
						<div className="item">
							<IconObject object={type} size={18} />
							<div className="name">{type?.name || translate('commonObjectType')}</div>
						</div>
						<Icon className="arrow black" />
					</div>
				) : ''}

				<Title text={translate('commonTemplates')} />

				{isAllowed ? (
					<div className="items">
						<ItemBlank />

						{this.items.map((item: any, i: number) => (
							<PreviewObject
								key={i}
								className={this.isDefaultTemplate(item.id) ? 'isDefault' : ''}
								rootId={item.id}
								size={I.PreviewSize.Small}
								onClick={e => this.onClick(e, item)}
								onMore={e => this.onMore(e, item)}
							/>
						))}

						<div className="previewObject small" onClick={e => this.onClick(e, itemAdd)}>
							<div className="border" />
							<Icon className="add" />
						</div>
					</div>
				) : <EmptySearch text={translate('menuDataviewTemplateUnsupported')} />}
			</React.Fragment>
		);
	};

	componentDidMount () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, typeId, templateId, getView, hasSources } = data;
		const view = getView();

		this.rebind();

		UtilObject.checkDefaultTemplate(typeId, templateId, (res) => {
			this.setState({ templateId: (!hasSources || !res) ? '' : templateId }, () => this.load(true));
		});
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', e => this.props.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
	};

	unbind () {
		$(window).off('keydown.menu');
	};

	reload () {
		this.load(true);
	};

	load (clear: boolean, callBack?: (message: any) => void) {
		const { param } = this.props;
		const { data } = param;
		const { typeId } = data;

		if (clear) {
			this.setState({ loading: true });
		};

		UtilData.getTemplatesByTypeId(typeId, (message) => {
			if (message.error.code) {
				return;
			};

			if (callBack) {
				callBack(message);
			};

			if (clear) {
				this.items = [];
			};

			this.items = this.items.concat((message.records || []).map((it: any) => {
				it.name = String(it.name || UtilObject.defaultName('Page'));
				return it;
			}));

			if (clear) {
				this.setState({ loading: false });
			} else {
				this.forceUpdate();
			};
		});
	};

	onMore (e: any, item: any) {
		const { param } = this.props;
		const { data } = param;
		const { onSetDefault, route, typeId } = data;
		const { templateId } = this.state;
		const node = $(`#item-${item.id}`)

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
					template: item,
					isView: true,
					typeId,
					templateId,
					route,
					onArchive: this.reload,
					onDuplicate: (object) => UtilObject.openPopup(object, {}),
					onSetDefault: () => { 
						if (onSetDefault) {
							onSetDefault(item, this.reload);
						};
					},
				}
			});
		});
	};

	onClick (e: any, item: any) {
		const { param } = this.props;
		const { data } = param;
		const { onSelect } = data;

		if (onSelect) {
			onSelect(item, this.reload);
			menuStore.updateData(this.props.id, { templateId: item.id });
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
				filter: '',
				filters: [
					{ operator: I.FilterOperator.And, relationKey: 'recommendedLayout', condition: I.FilterCondition.In, value: UtilObject.getPageLayouts() },
				],
				onClick: (item) => {
					const type = dbStore.getType(item.id);
					if (!type) {
						return;
					};

					window.setTimeout(() => {
						menuStore.updateData(this.props.id, { typeId: item.id });
						this.reload();

						if (onTypeChange) {
							onTypeChange(item.id, this.reload);
						};
					}, type.isInstalled ? 0 : 50);
				},
			}
		});
	};

	isDefaultTemplate (id: string): boolean {
		return id == this.state.templateId;
	};
};

export default MenuTemplateList;
