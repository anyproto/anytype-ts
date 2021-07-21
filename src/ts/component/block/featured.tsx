import * as React from 'react';
import { I, C, DataUtil, Util, focus } from 'ts/lib';
import { Cell } from 'ts/component';
import { observer } from 'mobx-react';
import { blockStore, detailStore, dbStore, menuStore } from 'ts/store';

interface Props extends I.BlockComponent {
	iconSize?: number;
};

const $ = require('jquery');
const Constant = require('json/constant.json');

const PREFIX = 'blockFeatured';

@observer
class BlockFeatured extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	cellRefs: Map<string, any> = new Map();

	public static defaultProps = {
		iconSize: 24,
	};

	constructor (props: any) {
		super(props);
		
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onType = this.onType.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onCellClick = this.onCellClick.bind(this);
		this.onCellChange = this.onCellChange.bind(this);
		this.onMouseEnter = this.onMouseEnter.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
		this.onRelation = this.onRelation.bind(this);
		this.elementMapper = this.elementMapper.bind(this);
	};

	render () {
		const { rootId, block, iconSize, isPopup, readonly } = this.props;
		const object = detailStore.get(rootId, rootId, [ Constant.relationKey.featured ]);
		const items = this.getItems();
		const type: any = dbStore.getObjectType(object.type) || {};
		const bullet = <div className="bullet" />;
		const allowedValue = blockStore.isAllowed(rootId, rootId, [ I.RestrictionObject.Details ]);

		return (
			<div className={[ 'wrap', 'focusable', 'c' + block.id ].join(' ')} tabIndex={0} onKeyDown={this.onKeyDown} onKeyUp={this.onKeyUp}>
				{type ? (
					<div 
						id={DataUtil.cellId(PREFIX, Constant.relationKey.type, 0)} 
						className="cellContent type"
						onClick={this.onType}
						onMouseEnter={(e: any) => { this.onMouseEnter(e, Constant.relationKey.type); }}
						onMouseLeave={this.onMouseLeave}
					>
						<div className="name">{Util.shorten(type.name || DataUtil.defaultName('page'), 32)}</div>
					</div>
				): ''}

				{items.map((relationKey: any, i: any) => {
					const id = DataUtil.cellId(PREFIX, relationKey, 0);
					const relation = dbStore.getRelation(rootId, rootId, relationKey);
					const canEdit = !readonly && allowedValue && !relation.isReadonlyValue;
					const cn = [ 'cell', (canEdit ? 'canEdit' : '') ];
					const record = detailStore.get(rootId, rootId, [ relationKey ]);
					const check = DataUtil.checkRelationValue(relation, record[relationKey]);

					if (!check && !canEdit) {
						return null;
					};

					return (
						<React.Fragment key={i}>
							{bullet}
							<span id={id} className={cn.join(' ')} onClick={(e: any) => { 
								e.persist(); 
								this.onRelation(e, relationKey); 
							}}>
								<Cell 
									ref={(ref: any) => { this.cellRefs.set(id, ref); }} 
									rootId={rootId}
									storeId={rootId}
									block={block}
									relationKey={relationKey}
									getRecord={() => { return record; }}
									viewType={I.ViewType.Grid}
									index={0}
									scrollContainer={Util.getScrollContainer(isPopup ? 'popup' : 'page')}
									pageContainer={Util.getPageContainer(isPopup ? 'popup' : 'page')}
									iconSize={iconSize}
									readonly={!canEdit}
									isInline={true}
									idPrefix={PREFIX}
									elementMapper={this.elementMapper}
									onMouseEnter={(e: any) => { this.onMouseEnter(e, relationKey); }}
									onMouseLeave={this.onMouseLeave}
								/>
							</span>
						</React.Fragment>
					);
				})}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};
	
	onFocus () {
		const { block } = this.props;
		focus.set(block.id, { from: 0, to: 0 });
	};

	getItems () {
		const { rootId } = this.props;
		const object = detailStore.get(rootId, rootId);

		return (object[Constant.relationKey.featured] || []).filter((it: any) => {
			const relation = dbStore.getRelation(rootId, rootId, it);
			if (!relation) {
				return false;
			};
			if ([ Constant.relationKey.type, Constant.relationKey.description ].indexOf(it) >=  0) {
				return false;
			};
			if (relation.format == I.RelationType.Checkbox) {
				return true;
			};
			/*
			if (!object[it]) {
				return false;
			};
			if ([ I.RelationType.Status, I.RelationType.Tag, I.RelationType.Object ].indexOf(relation.format) >= 0 && !object[it].length) {
				return false;
			};
			*/
			return true;
		});
	};

	onKeyDown (e: any) {
		const { onKeyDown } = this.props;
		
		if (onKeyDown) {
			onKeyDown(e, '', [], { from: 0, to: 0 });
		};
	};
	
	onKeyUp (e: any) {
		const { onKeyUp } = this.props;

		if (onKeyUp) {
			onKeyUp(e, '', [], { from: 0, to: 0 });
		};
	};

	onCellClick (e: any, relationKey: string, index: number) {
		const { rootId } = this.props;
		const relation = dbStore.getRelation(rootId, rootId, relationKey);

		if (!relation || relation.isReadonlyValue) {
			return;
		};

		const id = DataUtil.cellId(PREFIX, relationKey, index);
		const ref = this.cellRefs.get(id);

		if (ref) {
			ref.onClick(e);
		};
	};

	onCellChange (id: string, relationKey: string, value: any) {
		const { rootId } = this.props;
		const relation = dbStore.getRelation(rootId, rootId, relationKey);
		const details = [ 
			{ key: relationKey, value: DataUtil.formatRelationValue(relation, value, true) },
		];
		C.BlockSetDetails(rootId, details);
	};

	onMouseEnter (e: any, relationKey: string) {
		const { rootId } = this.props;
		const cell = $('#' + DataUtil.cellId(PREFIX, relationKey, 0));
		const relation = dbStore.getRelation(rootId, rootId, relationKey);

		if (relation) {
			Util.tooltipShow(relation.name, cell, I.MenuDirection.Top);
		};
	};

	onMouseLeave (e: any) {
		Util.tooltipHide(false);
	};

	onType (e: any) {
		const { rootId, block, readonly } = this.props;
		const allowed = blockStore.isAllowed(rootId, rootId, [ I.RestrictionObject.Type ]);
		const types = dbStore.getObjectTypesForSBType(I.SmartBlockType.Page).map((it: any) => { return it.id; });

		if (readonly || !allowed) {
			const object = detailStore.get(rootId, rootId, []);
			DataUtil.objectOpenEvent(e, { id: object.type, layout: I.ObjectLayout.Type });
			return;
		};

		const filters = [
			{ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.In, value: types }
		];

		menuStore.closeAll(null, () => { 
			menuStore.open('searchObject', {
				element: `#block-${block.id} #${DataUtil.cellId(PREFIX, Constant.relationKey.type, 0)}`,
				className: 'big single',
				horizontal: I.MenuDirection.Center,
				data: {
					isBig: true,
					rootId: rootId,
					blockId: block.id,
					blockIds: [ block.id ],
					placeholder: 'Change object type',
					placeholderFocus: 'Change object type',
					filters: filters,
					onSelect: (item: any) => {
						C.BlockObjectTypeSet(rootId, item.id);
					}
				}
			}); 
		});
	};

	onRelation (e: any, relationKey: string) {
		e.stopPropagation();

		if (menuStore.isOpen()) {
			menuStore.closeAll();
			return;
		};

		const { isPopup, rootId } = this.props;
		const relation = dbStore.getRelation(rootId, rootId, relationKey);

		if (relation.format == I.RelationType.Checkbox) {
			const object = detailStore.get(rootId, rootId, [ relationKey ]);
			const details = [ 
				{ key: relationKey, value: DataUtil.formatRelationValue(relation, !object[relationKey], true) },
			];
			C.BlockSetDetails(rootId, details);
			return;
		};

		const elementId = '#header';

		const param: any = {
			element: elementId,
			horizontal: I.MenuDirection.Right,
			noFlipY: true,
			noAnimation: true,
			subIds: Constant.menuIds.cell,
			onOpen: (component: any) => {
				component?.ref?.onCellClick(e, relationKey, 0);
				component?.ref?.scrollTo(relationKey, 0);
			},
			onClose: () => {
				menuStore.closeAll();
			},
			data: {
				relationKey: '',
				readonly: false,
				rootId: rootId,
			},
		};

		if (!isPopup) {
			param.fixedY = Util.sizeHeader();
			param.className = 'fixed';
			param.classNameWrap = 'fromHeader';
		};

		menuStore.closeAll(null, () => { menuStore.open('blockRelationView', param); });
	};

	elementMapper (relation: any, item: any) {
		item = Util.objectCopy(item);

		switch (relation.format) {
			case I.RelationType.File:
			case I.RelationType.Object:
				item.name = Util.shorten(item.name);
				break;

			case I.RelationType.Tag:
			case I.RelationType.Status:
				item.text = Util.shorten(item.text);
				break;
		};

		return item;
	};
	
};

export default BlockFeatured;