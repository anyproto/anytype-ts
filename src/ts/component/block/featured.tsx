import React, { forwardRef, useRef, useEffect, MouseEvent } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { observable } from 'mobx';
import { ObjectType, Cell, Block } from 'Component';
import { I, C, S, U, J, M, Preview, analytics, Relation, Onboarding, history as historyPopup, keyboard, translate } from 'Lib';

interface Props extends I.BlockComponent {
	size?: number;
	iconSize?: number;
};

const PREFIX = 'blockFeatured';
const SOURCE_LIMIT = 1;

const BlockFeatured = observer(forwardRef<I.BlockRef, Props>((props, ref) => {

	const { rootId, traceId, block, size = 18, iconSize = 18, isPopup, readonly, isInsidePreview, onKeyDown, onKeyUp } = props;
	const allowedValue = S.Block.checkFlags(rootId, rootId, [ I.RestrictionObject.Details ]);
	const check = U.Data.checkDetails(rootId, rootId, []);
	const { headerRelationsLayout } = check;
	const nodeRef = useRef(null);
	const cellRefs = useRef(new Map<string, any>());
	const menuContext = useRef(null);

	useEffect(() => {
		if (!isInsidePreview) {
			window.setTimeout(() => {
				checkType();
				checkSource();
			}, S.Menu.getTimeout());
		};

		init();

		return () => {
			cellRefs.current.clear();
		};
	}, []);

	useEffect(() => {
		init();
	});

	const init = () => {
		const items = getItems().filter(it => it.relationKey != 'description');
		const node = $(nodeRef.current);
		const obj = $(`#block-${block.id}`);

		obj.toggleClass('isHidden', !items.length);

		if (node) {
			node.find('.cell.first').removeClass('first');
			node.find('.cell').first().addClass('first');
		};
	};

	const renderType = () => {
		const object = getObject();
		const type = S.Detail.get(rootId, object.type, []);
		const id = Relation.cellId(PREFIX, 'type', object.id);
		const name = (
			<div className="name">
				<ObjectType object={type} />
			</div>
		);

		let ret = null;
		if (U.Object.isTemplateType(object.type)) {
			ret = (
				<span id={id} className="cell" key="type">
					<div className="cellContent type disabled">{name}</div>
					<div className="bullet" />
				</span>
			);
		} else {
			ret = (
				<span id={id} className="cell canEdit" key="type">
					<div
						id={id}
						className="cellContent type"
						onClick={onType}
						onMouseEnter={e => onMouseEnter(e, 'type')}
						onMouseLeave={onMouseLeave}
					>
						{name}
					</div>
					<div className="bullet" />
				</span>
			);
		};

		return ret;
	};

	const renderSetOf = () => {
		const storeId = getStoreId();
		const object = getObject();
		const mapper = it => U.Object.name(it);
		const types = Relation.getSetOfObjects(rootId, storeId, I.ObjectLayout.Type).map(mapper);
		const relations = Relation.getSetOfObjects(rootId, storeId, I.ObjectLayout.Relation).map(mapper);
		const setOfString = [];
		const tl = types.length;
		const rl = relations.length;
		const cn = [ 'cell' ];

		if (!readonly) {
			cn.push('canEdit');
		};

		if (tl) {
			setOfString.push(U.String.sprintf('%s: %s', U.Common.plural(tl, translate('pluralObjectType')), types.slice(0, SOURCE_LIMIT).join(', ')));

			if (tl > SOURCE_LIMIT) {
				setOfString.push(<div className="more">+{tl - SOURCE_LIMIT}</div>);
			};
		};
		if (rl) {
			setOfString.push(`${U.Common.plural(rl, translate('pluralProperty'))}: ${relations.slice(0, SOURCE_LIMIT).join(', ')}`);

			if (rl > SOURCE_LIMIT) {
				setOfString.push(<div className="more">+{rl - SOURCE_LIMIT}</div>);
			};
		};

		return (
			<span className={cn.join(' ')} key="setOf">
				<div
					id={Relation.cellId(PREFIX, 'setOf', object.id)}
					className="cellContent setOf"
					onClick={onSource}
					onMouseEnter={e => onMouseEnter(e, 'setOf', translate('blockFeaturedQuery'))}
					onMouseLeave={onMouseLeave}
				>
					{setOfString.length ? (
						<div className="name">
							{setOfString.map((it: any, i: number) => (
								<div className="element" key={i}>{it}</div>
							))}
						</div>
					) : (
						<div className="empty">{translate('blockFeaturedQuery')}</div>
					)}
				</div>
				<div className="bullet" />
			</span>
		);
	};

	const renderIdentity = () => {
		const storeId = getStoreId();
		const short = S.Detail.get(rootId, storeId, [ 'layout' ], true);

		if (!U.Object.isParticipantLayout(short.layout)) {
			return null;
		};

		const object = S.Detail.get(rootId, storeId, U.Subscription.participantRelationKeys());
		const relationKey = object.globalName ? 'globalName': 'identity';

		return (
			<span className="cell" key="identity">
				<div
					id={Relation.cellId(PREFIX, relationKey, object.id)}
					className="cellContent c-longText"
					onClick={(e: any) => {
						e.persist();
						onCellMenu(relationKey, 'dataviewText', { width: 288 }, { value: object[relationKey] || '' });
					}}
					onMouseEnter={e => onMouseEnter(e, relationKey, translate('blockFeaturedIdentity'))}
					onMouseLeave={onMouseLeave}
				>
					<div className="name">
						{U.String.shorten(object[relationKey], 150)}
					</div>
				</div>
				<div className="bullet" />
			</span>
		);
	};

	const renderLinks = (relationKey: string, index: number) => {
		const object = getObject();
		const id = Relation.cellId(PREFIX, relationKey, object.id);
		const value = object[relationKey];
		const options = Relation.getArrayValue(value).map(it => S.Detail.get(rootId, it, [])).filter(it => !it._empty_);
		const l = options.length;

		if (!l) {
			return null;
		};

		return (
			<span className="cell" key={index} >
				<div 
					id={id} 
					className="cellContent"
					onClick={e => onLinks(e, relationKey)}
				>
					{`${l} ${U.Common.plural(l, translate(U.String.toCamelCase([ 'plural', relationKey ].join('-'))))}`}
				</div>
				<div className="bullet" />
			</span>
		);
	};

	const getObject = () => {
		const keys = [ 'type', 'setOf', 'featuredRelations', 'layout' ].concat(getItems().map(it => it.relationKey));

		return S.Detail.get(rootId, getStoreId(), keys, true);
	};

	const checkType = () => {
		const storeId = getStoreId();
		const object = S.Detail.get(rootId, storeId, [ 'type' ], true);
		const type = S.Detail.get(rootId, object.type, [ 'isDeleted' ], true);

		if (type.isDeleted) {
			Onboarding.start('typeDeleted', isPopup);
		};
	};

	const checkSource = () => {
		const storeId = getStoreId();
		const object = S.Detail.get(rootId, storeId, [ 'layout', 'setOf' ]);
		const keys = getItems().map(it => it.relationKey);

		if (object._empty_ || !U.Object.isSetLayout(object.layout) || !keys.includes('setOf')) {
			return;
		};

		const setOf = Relation.getArrayValue(object.setOf);
		const types = Relation.getSetOfObjects(rootId, rootId, I.ObjectLayout.Type);
		const relations = Relation.getSetOfObjects(rootId, rootId, I.ObjectLayout.Relation);

		if (!setOf.length) {
			onSource();
		} else
		if (setOf.length && (setOf.length > (types.length + relations.length))) {
			Onboarding.start('sourceDeleted', isPopup, true);
		};
	};

	const onKeyDownHandler = (e: any) => {
		onKeyDown?.(e, '', [], { from: 0, to: 0 }, props);
	};

	const onKeyUpHandler = (e: any) => {
		onKeyUp?.(e, '', [], { from: 0, to: 0 }, props);
	};

	const onMouseEnter = (e: any, relationKey: string, text?: string) => {
		const cell = $(`#${Relation.cellId(PREFIX, relationKey, rootId)}`);
		const relation = S.Record.getRelationByKey(relationKey);
		const show = (text: string) => {
			Preview.tooltipShow({ text, element: cell });
		};

		if (text) {
			show(text);
		} else 
		if (relation) {
			show(relation.name);
		};
	};

	const onMouseLeave = (e: any) => {
		Preview.tooltipHide(false);
	};

	const onType = (e: any) => {
		e.persist();
		e.preventDefault();
		e.stopPropagation();

		const object = S.Detail.get(rootId, rootId, [ 'setOf' ]);
		const type = S.Detail.get(rootId, object.type, []);
		const allowed = S.Block.checkFlags(rootId, rootId, [ I.RestrictionObject.Type ]);
		const typeIsDeleted = type._empty_ || type.isDeleted || type.isArchived;
		const options: any[] = [];
		const check = U.Data.checkDetails(rootId, rootId, []);
		const { headerRelationsLayout } = check;

		if (!typeIsDeleted) {
			options.push({ id: 'open', name: translate('blockFeaturedTypeMenuOpenType') });
		};

		if (!readonly) {
			if (allowed) {
				options.push({ id: 'change', name: translate('blockFeaturedTypeMenuChangeType'), arrow: true });
			};

			if (!typeIsDeleted && U.Object.isSetLayout(object.layout)) {
				options.push({ id: 'turnCollection', name: translate('blockFeaturedTypeMenuTurnSetIntoCollection') });
			};
		};

		const element = [ `#block-${block.id}`, `#${Relation.cellId(PREFIX, 'type', rootId)}` ];

		if (headerRelationsLayout == I.FeaturedRelationLayout.Column) {
			element.push('.cell');
		};

		S.Menu.open('select', {
			element: element.join(' '),
			classNameWrap: 'fromBlock',
			offsetY: 4,
			subIds: J.Menu.featuredType,
			onOpen: context => menuContext.current = context,
			data: {
				options,
				noClose: true,
				onOver: onTypeOver,
				onSelect: onTypeSelect,
			},
		});
	};

	const onTypeOver = (e: any, item: any) => {
		if (!menuContext.current) {
			return;
		};

		if (!item.arrow) {
			S.Menu.closeAll(J.Menu.featuredType);
			return;
		};

		const object = S.Detail.get(rootId, rootId, [ 'setOf', 'internalFlags' ]);
		const menuParam = {
			menuId: item.id,
			element: `#${menuContext.current.getId()} #item-${item.id}`,
			classNameWrap: 'fromBlock',
			offsetX: menuContext.current.getSize().width,
			vertical: I.MenuDirection.Center,
			isSub: true,
			rebind: menuContext.current.getChildRef().rebind,
			parentId: menuContext.current.props.id,
			data: {
				isBig: true,
				rootId: rootId,
				blockId: block.id,
				blockIds: [ block.id ],
			}
		};

		let menuId = '';

		switch (item.id) {
			case 'change': {
				const layouts = U.Object.isCollectionLayout(object.layout) ? [ I.ObjectLayout.Collection ] : U.Object.getPageLayouts();

				menuId = 'typeSuggest';
				menuParam.data = Object.assign(menuParam.data, {
					filter: '',
					filters: [
						{ relationKey: 'recommendedLayout', condition: I.FilterCondition.In, value: layouts },
						{ relationKey: 'uniqueKey', condition: I.FilterCondition.NotIn, value: [ J.Constant.typeKey.template, J.Constant.typeKey.type ] }
					],
					skipIds: [ object.type ],
					onClick: (item: any) => {
						keyboard.disableClose(true);

						const open = () => {
							U.Object.openAuto({ ...object, layout: item.recommendedLayout });
							keyboard.disableClose(false);
						};

						S.Detail.update(rootId, { id: item.id, details: item }, false);

						C.ObjectSetObjectType(rootId, item.uniqueKey, () => {
							if (object.internalFlags && object.internalFlags.includes(I.ObjectFlag.SelectTemplate)) {
								C.ObjectApplyTemplate(rootId, item.defaultTemplateId, open);
							} else {
								open();
							};
						});

						menuContext.current?.close();
						analytics.event('ChangeObjectType', { objectType: item.id, count: 1, route: analytics.route.featured });
					},
				});
				break;
			};
		};

		if (menuId) {
			if (S.Menu.isOpen(menuId, item.id)) {
				S.Menu.open(menuId, menuParam);
			} else {
				S.Menu.closeAll(J.Menu.featuredType, () => {
					S.Menu.open(menuId, menuParam);
				});
			};
		};
	};

	const onTypeSelect = (e: any, item: any) => {
		if (item.arrow) {
			return;
		};

		const object = S.Detail.get(rootId, rootId, [ 'setOf', 'collectionOf' ]);
		const type = S.Record.getTypeById(object.type);

		menuContext.current?.close();

		switch (item.id) {
			case 'open':
				U.Object.openConfig(e, type);
				break;

			case 'turnCollection':
				// Add Collection type to details since middleware adds details async
				const collectionType = S.Record.getCollectionType();
				if (collectionType) {
					S.Detail.update(rootId, { id: collectionType.id, details: collectionType }, true);
				};

				C.ObjectToCollection(rootId, (message: any) => {
					if (message.error.code) {
						return;
					};

					if (isPopup) {
						historyPopup.clear();
					};

					keyboard.disableClose(true);
					U.Object.openAuto({ id: rootId, layout: I.ObjectLayout.Collection }, { replace: true });
					keyboard.disableClose(false);
					window.setTimeout(() => { Preview.toastShow({ text: U.String.sprintf(translate('toastTurnIntoCollection'), object.name) }); }, 200);

					analytics.event('SetTurnIntoCollection');
				});
				break;
		};
	};

	const onSource = () => {
		if (readonly || S.Menu.isOpen('dataviewSource')) {
			return;
		};

		S.Menu.closeAll(null, () => {
			S.Menu.open('dataviewSource', {
				element: `#block-${block.id} #${Relation.cellId(PREFIX, 'setOf', rootId)}`,
				classNameWrap: 'fromBlock',
				noFlipX: true,
				offsetY: 4,
				data: {
					rootId,
					objectId: rootId,
					blockId: J.Constant.blockId.dataview,
				}
			}); 
		});
	};

	const onCellClick = (e: any, id: string) => {
		const ref = cellRefs.current.get(id);

		if (ref) {
			ref.onClick(e);
		};
	};

	const onCellChange = (id: string, relationKey: string, value: any, callBack?: (message: any) => void) => {
		const relation = S.Record.getRelationByKey(relationKey);

		C.ObjectListSetDetails([ id ], [ { key: relationKey, value } ], callBack);
		analytics.changeRelationValue(relation, value, { type: 'featured', id: 'Single' });
	};

	const onCellMenu = (relationKey: string, menuId: string, param: any, data: any) => {
		const storeId = getStoreId();
		const object = S.Detail.get(rootId, storeId, [ relationKey ]);
		const relation = S.Record.getRelationByKey(relationKey);
		const elementId = `#block-${block.id} #${Relation.cellId(PREFIX, relationKey, object.id)}`;

		if (!relation) {
			return;
		};

		let menuParam = {
			element: elementId,
			className: 'fromBlockFeatured',
			offsetY: 4,
			noFlipX: true,
			title: relation.name,
			onClose: () => S.Menu.closeAll(),
			data: {
				rootId,
				blockId: block.id,
				relation: observable.box(relation),
				relationKey,
				canEdit: canEdit(relation),
				onChange: (v: any, callBack?: () => void) => {
					const value = Relation.formatValue(relation, v, true);

					C.ObjectListSetDetails([ rootId ], [ { key: relationKey, value } ]);
					analytics.changeRelationValue(relation, value, { type: 'featured', id: 'Single' });

					callBack?.();
				}
			}
		};

		menuParam = Object.assign(menuParam, param);
		menuParam.data = Object.assign(menuParam.data, data);

		S.Menu.closeAll(J.Menu.cell, () => {
			S.Menu.open(menuId, menuParam);
		});
	};

	const onLinks = (e: MouseEvent, relationKey: string) => {
		const relation = S.Record.getRelationByKey(relationKey);
		if (!relation) {
			return;
		};

		const storeId = getStoreId();
		const object = S.Detail.get(rootId, storeId);
		const value = Relation.getArrayValue(object[relationKey]);
		const elementId = `#block-${block.id} #${Relation.cellId(PREFIX, relationKey, object.id)}`;
		const options = value.map(it => S.Detail.get(rootId, it, [])).filter(it => !it._empty_).map(it => ({
			...it,
			withDescription: true,
			iconSize: 40,
			object: it,
		}));

		S.Menu.closeAll([ 'select' ], () => {
			S.Menu.open('select', {
				element: elementId,
				className: 'featuredLinks',
				classNameWrap: 'fromBlock',
				title: relation.name,
				width: 360,
				offsetY: 4,
				noFlipY: true,
				data: {
					options,
					onSelect: (e: any, item: any) => U.Object.openAuto(item),
				}
			});
		});
	};

	const elementMapper = (relation: any, item: any) => {
		item = U.Common.objectCopy(item);

		switch (relation.format) {
			case I.RelationType.File:
			case I.RelationType.Object:
				item.name = U.String.shorten(item.name, 150);
				break;

			case I.RelationType.MultiSelect:
			case I.RelationType.Select:
				item.text = U.String.shorten(item.text, 150);
				break;
		};

		return item;
	};

	const getStoreId = (): string => {
		return traceId ? rootId.replace(`-${traceId}`, '') : rootId;
	};

	const canEdit = (relation: any) => {
		return !readonly && !relation.isReadonlyValue;
	};

	const getItems = (): any[] => {
		const storeId = getStoreId();
		const short = S.Detail.get(rootId, storeId, [ 'type', 'targetObjectType', 'layout', 'featuredRelations', 'headerRelationsLayout' ], true);
		const keys = Relation.getArrayValue(short.featuredRelations).filter(it => it != 'description');

		let ret = [];
		if (!keys.length) {
			const typeId = short.targetObjectType || short.type;
			const type = S.Record.getTypeById(typeId);

			if (!type || type.isDeleted) {
				ret = [ S.Record.getRelationByKey('type') ];
			} else {
				ret = S.Record.getTypeFeaturedRelations(typeId);
			};
		} else {
			ret = keys.map(it => S.Record.getRelationByKey(it));
		};

		return ret.filter(it => it && !it.isDeleted && !it.isArchived);
	};

	const items = getItems();
	const object = getObject();

	return (
		<div 
			ref={nodeRef}
			className={[ 'wrap', 'focusable', `c${block.id}` ].join(' ')} 
			tabIndex={0} 
			onKeyDown={onKeyDownHandler} 
			onKeyUp={onKeyUpHandler}
		>
			{headerRelationsLayout == I.FeaturedRelationLayout.Column ? (
				<div className="listColumn">
					{items.map((relation: any) => {
						const id = Relation.cellId(PREFIX, relation.relationKey, object.id);
						const value = object[relation.relationKey];

						if (readonly && Relation.isEmpty(value)) {
							return null;
						};

						const canEdit = !readonly && allowedValue && !relation.isReadonlyValue;
						const passParam: any = {};

						if (relation.relationKey == 'type') {
							passParam.onCellClick = onType;
						};

						return (
							<span id={id} key={relation.id}>
								<Block
									{...props}
									rootId={rootId}
									block={new M.Block({ id: relation.id, type: I.BlockType.Relation, content: { key: relation.relationKey } })}
									readonly={!canEdit}
									isSelectionDisabled={true}
									isContextMenuDisabled={true}
									passParam={passParam}
								/>
							</span>
						);
					})}
				</div>
			) : (
				<div className="listInline">
					{items.map((relation: any, i: any) => {
						const id = Relation.cellId(PREFIX, relation.relationKey, object.id);
						const value = object[relation.relationKey];
						const canEdit = !readonly && allowedValue && !relation.isReadonlyValue;
						const cn = [ 'cell' ];

						if (readonly && Relation.isEmpty(value)) {
							return null;
						};

						if (canEdit) {
							cn.push('canEdit');
						};

						if (i == items.length - 1) {
							cn.push('last');
						};

						if (relation.relationKey == 'type') {
							return renderType();
						};

						if (relation.relationKey == 'setOf') {
							return renderSetOf();
						};

						if (relation.relationKey == 'identity') {
							return renderIdentity();
						};

						if ([ 'links', 'backlinks' ].includes(relation.relationKey)) {
							return renderLinks(relation.relationKey, i);
						};

						return (
							<span
								key={i}
								className={cn.join(' ')}
								onClick={e => onCellClick(e, id)}
							>
								<Cell
									ref={ref => cellRefs.current.set(id, ref)}
									placeholder={relation.name}
									elementId={id}
									rootId={rootId}
									subId={rootId}
									block={block}
									relationKey={relation.relationKey}
									getRecord={() => object}
									viewType={I.ViewType.Grid}
									pageContainer={U.Common.getCellContainer(isPopup ? 'popup' : 'page')}
									size={size}
									iconSize={iconSize}
									readonly={!canEdit}
									isInline={true}
									idPrefix={PREFIX}
									elementMapper={elementMapper}
									tooltipParam={{ text: relation.name, typeX: I.MenuDirection.Left }}
									arrayLimit={relation.format == I.RelationType.Object ? 1 : 2}
									textLimit={150}
									shortUrl={true}
									onMouseLeave={onMouseLeave}
									withName={true}
									noInplace={true}
									onCellChange={onCellChange}
									menuParam={{ className: 'fromBlockFeatured', classNameWrap: 'fromBlock' }}
								/>
								<div className="bullet" />
							</span>
						);
					})}
				</div>
			)}
		</div>
	);

}));

export default BlockFeatured;
