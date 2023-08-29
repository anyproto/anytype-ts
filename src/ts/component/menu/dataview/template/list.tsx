import * as React from 'react';
import $ from 'jquery';
import { Icon, Title, Label, PreviewObject } from 'Component';
import { analytics, C, I, keyboard, UtilObject, translate, Action, UtilData } from 'Lib';
import { commonStore, dbStore, menuStore } from 'Store';
import Constant from 'json/constant.json';

class MenuTemplateList extends React.Component<I.Menu> {

	state = {
		isLoading: false,
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
		const { getTypeId, withTypeSelect } = data;

		const typeId = this.typeId || getTypeId();
		const type = dbStore.getType(typeId);
		const itemBlank = { id: Constant.templateId.blank };
		const itemAdd = { id: Constant.templateId.new };
		const templatesAllowed = UtilObject.isAllowedTemplate(typeId);

		return (
			<React.Fragment>

				{withTypeSelect ? (
					<div id="defaultType" className="select" onClick={this.onType}>
						<div className="item">
							<div className="name">{type.name || translate('commonObjectType')}</div>
						</div>
						<Icon className="arrow black" />
					</div>
				) : ''}

				<Title text={translate('commonTemplates')} />

				{templatesAllowed ? (
					<div className="items">
						<div id={`item-${Constant.templateId.blank}`} className="previewObject small blank">
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

						{this.items.map((item: any, i: number) => (
							<PreviewObject
								key={i}
								rootId={item.id}
								previewSize="small"
								onClick={e => this.onClick(e, item)}
								onMore={e => this.onMore(e, item)}
							/>
						))}

						<div className="previewObject small" onClick={e => this.onClick(e, itemAdd)}>
							<div className="border" />
							<Icon className="add" />
						</div>
					</div>
				) : <Label text={'This object type doesn\'t support templates'} />}
			</React.Fragment>
		);
	};

	componentDidMount () {
		this.rebind();
		this.load(true);
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
		const { getTypeId, getTemplateId } = data;
		const typeId = this.typeId || getTypeId();
		const defaultTemplateId = getTemplateId();

		const filters: I.Filter[] = [
			{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: Constant.typeId.template },
			{ operator: I.FilterOperator.And, relationKey: 'targetObjectType', condition: I.FilterCondition.In, value: typeId },
		];
		const sorts = [
			{ relationKey: 'name', type: I.SortType.Asc },
		];

		const dataMapper = it => ({
			...it,
			typeId,
			caption: (it.id == defaultTemplateId) ? translate('commonDefault') : '',
			isDefault: (it.id == defaultTemplateId),
		});

		if (clear) {
			this.setState({ loading: true });
		};

		UtilData.search({
			filters,
			sorts,
			limit: Constant.limit.menuRecords,
		}, (message: any) => {
			if (message.error.code) {
				this.setState({ loading: false });
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

			this.items = this.items.map(dataMapper);

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
		const { onSetDefault, onArchive, route } = data;
		const node = $(`#item-${item.id}`)

		e.preventDefault();
		e.stopPropagation();

		if (menuStore.isOpen('dataviewTemplate', item.id)) {
			menuStore.close('dataviewTemplate');
			return;
		};

		const menuActions: any = {
			onArchive: () => onArchive(item, this.reload),
			onDuplicate: (object) => UtilObject.openPopup(object, {})
		};

		if (onSetDefault) {
			menuActions.onSetDefault = onSetDefault(item, this.reload)
		};

		menuStore.closeAll(Constant.menuIds.dataviewTemplate, () => {
			menuStore.open('dataviewTemplate', {
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
					route,
					...menuActions
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
					this.typeId = item.id;
					this.reload();
					if (onTypeChange) {
						onTypeChange(item.id)
					};
				},
			}
		});
	};

	onMouseEnter (e: any, item: any) {
		this.onOver(e, item);
	};

	onOver (e: any, item: any) {
		const { param } = this.props;
		const { data } = param;
		const { onOver } = data;

		if (!keyboard.isMouseDisabled) {
			// this.props.setActive(item, false);
		};

		if (onOver) {
			// onOver();
		};
	};

};

export default MenuTemplateList;
