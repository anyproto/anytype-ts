import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Icon, IconObject } from 'Component';
import { I, C, S, U, Relation, analytics, keyboard, translate } from 'Lib';

const MenuSource = observer(class MenuSource extends React.Component<I.Menu> {
	
	n = -1;

	constructor (props: I.Menu) {
		super(props);
		
		this.save = this.save.bind(this);
		this.onAdd = this.onAdd.bind(this);
		this.onRemove = this.onRemove.bind(this);
	};
	
	render () {
		const { param, setHover } = this.props;
		const { data } = param;
		const { rootId, objectId } = data;
		const items = this.getItems();
		const types = Relation.getSetOfObjects(rootId, objectId, I.ObjectLayout.Type);
		
		const Item = (item: any) => {
			const canDelete = item.id != 'type';
			return (
				<form id={'item-' + item.itemId} className={[ 'item' ].join(' ')} onMouseEnter={e => this.onOver(e, item)}>
					<IconObject size={40} object={item} />
					<div className="txt" onClick={e => this.onClick(e, item)}>
						<div className="name">{item.name}</div>
						<div className="value">{item.value}</div>
					</div>
					<div className="buttons">
						{canDelete ? <Icon className="delete withBackground" onClick={e => this.onRemove(e, item)} /> : ''}
					</div>
				</form>
			);
		};
		
		return (
			<div className="items">
				<div className="scrollWrap">
					{items.map((item: any, i: number) => (
						<Item key={i} {...item} />
					))}

					{!items.length ? (
						<div className="item empty">
							<div className="inner">{translate('menuDataviewSourceSelectOneOrMoreSources')}</div>
						</div>
					) : ''}
				</div>
				
				{!types.length ? (
					<div className="bottom">
						<div className="line" />
						<div 
							id="item-add" 
							className="item add" 
							onClick={this.onAdd} 
							onMouseEnter={() => setHover({ id: 'add' })} 
							//onMouseLeave={() => setHover()}
						>
							<Icon className="plus" />
							<div className="name">{translate('menuDataviewSourceAddRelation')}</div>
						</div>
					</div>
				) : ''}
			</div>
		);
	};
	
	componentDidMount () {
		this.rebind();
	};

	componentDidUpdate () {
		this.props.setActive();
	};

	componentWillUnmount () {
		this.unbind();
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', e => this.props.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};

	onAdd (e: any) {
		const { getId, getSize } = this.props;
		const value = this.getValue();

		S.Menu.open('searchObject', { 
			element: `#${getId()} #item-add`,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			className: 'single',
			data: {
				skipIds: value,
				filters: [
					{ relationKey: 'resolvedLayout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Relation },
				],
				sorts: [
					{ relationKey: 'name', type: I.SortType.Asc }
				],
				onSelect: (item: any) => {
					this.save([ item.id ]);

					if (!value.length) {
						analytics.event('SetSelectQuery', { type: 'relation' });
					};
				}
			}
		});
	};

	onRemove (e: any, item: any) {
		if (item) {
			this.save(this.getValueIds().filter(it => it != item.id));
		};
	};

	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};

	onClick (e: any, item: any) {
		const { param, getId, getSize, close } = this.props;
		const { data } = param;
		const { readonly } = data;

		if ((item.itemId != 'type') || readonly) {
			return;
		};

		S.Menu.open('typeSuggest', {
			element: `#${getId()} #item-${item.itemId}`,
			offsetX: getSize().width,
			offsetY: -56,
			data: {
				filter: '',
				onClick: (item: any) => {
					this.save([ item.id ]);

					analytics.event('SetSelectQuery', { type: 'type' });
					close();
				}
			}
		}); 
	};

	save (value: string[], callBack?: () => void) {
		const { param } = this.props;
		const { data } = param;
		const { objectId, blockId } = data;

		C.ObjectSetSource(objectId, value, () => {
			if (callBack) {
				callBack();
			};

			this.forceUpdate();
		});
	};

	getValue () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, objectId } = data;

		return [].
			concat(Relation.getSetOfObjects(rootId, objectId, I.ObjectLayout.Type)).
			concat(Relation.getSetOfObjects(rootId, objectId, I.ObjectLayout.Relation));
	};

	getValueIds () {
		return this.getValue().map(it => it.id);
	};

	getItems () {
		const value = this.getValue();
		const items = [];

		if (!value.length) {
			items.push({
				id: 'type',
				itemId: 'type',
				name: translate('commonObjectType'),
				relationFormat: I.RelationType.Object,
				layout: I.ObjectLayout.Relation,
				value: translate('commonNone'),
			});
		} else {
			value.forEach(it => {
				if (U.Object.isTypeLayout(it.layout)) {
					items.push({
						...it,
						itemId: 'type',
						name: translate('commonObjectType'),
						value: it.name,
					});
				} else {
					items.push({ ...it, itemId: it.id, value: translate('commonAll') });
				};
			});
		};
		return items;
	};

});

export default MenuSource;
