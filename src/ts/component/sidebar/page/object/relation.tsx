import React, { forwardRef, useEffect, MouseEvent, useRef, useImperativeHandle, useState } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Label, Button, Icon } from 'Component';
import { I, S, U, C, translate, keyboard, Relation, Storage, analytics } from 'Lib';
import Section from 'Component/sidebar/section';

const SidebarPageObjectRelation = observer(forwardRef<{}, I.SidebarPageComponent>((props, ref) => {

	const [ dummy, setDummy ] = useState(0);
	const { rootId, readonly, page, isPopup } = props;
	const object = S.Detail.get(rootId, rootId);
	const isReadonly = readonly || !S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Details ]);
	const type = S.Record.getTypeById(object.type);
	const allowObjectDetails = S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Details ]);
	const allowTypeDetails = S.Block.isAllowed(type?.restrictions, [ I.RestrictionObject.Details ]);
	const isTemplate = U.Object.isTemplateType(object.type);
	const sectionsRef = useRef({});

	const getSections = (): any[] => {
		const isTemplate = U.Object.isTemplateType(object.type);
		const type = S.Record.getTypeById(isTemplate ? object.targetObjectType : object.type) || {};
		const local = S.Record
			.getConflictRelations(rootId, rootId, type.id)
			.sort(U.Data.sortByName)
			.map(it => ({ ...it, onMore: onLocal }));
		const featuredIds = Relation.getArrayValue(type.recommendedFeaturedRelations);
		const recommendedIds = Relation.getArrayValue(type.recommendedRelations);
		const hiddenIds = Relation.getArrayValue(type.recommendedHiddenRelations);
		const skipKeys = [ 'name', 'description' ];
		const filterMapper = it => it && it.relationKey && !it.isArchived && !skipKeys.includes(it.relationKey);

		let items = recommendedIds.map(it => S.Record.getRelationById(it));
		items = items.filter(filterMapper);
		items = S.Record.checkHiddenObjects(items);

		let featured = featuredIds.map(it => S.Record.getRelationById(it));
		featured = featured.filter(filterMapper);
		featured = S.Record.checkHiddenObjects(featured);

		let hidden = hiddenIds.map(it => S.Record.getRelationById(it));
		hidden = S.Record.checkHiddenObjects(hidden);
		hidden = hidden.filter(it => filterMapper(it) && !(it.isReadonlyValue && Relation.isEmpty(object[it.relationKey])));

		return [
			{ id: 'object', children: featured.concat(items), withEmpty: true },
			{ id: 'hidden', name: translate('sidebarTypeRelationHidden'), children: hidden, withToggle: true },
			{ id: 'local', name: translate('sidebarRelationLocal'), children: local, description: translate('sidebarObjectRelationLocalDescription'), withToggle: true }
		].filter(it => it.children.length || it.withEmpty);
	};

	const onSetUp = () => {
		S.Common.setRightSidebarState(isPopup, { 
			page: 'type', 
			rootId: object.targetObjectType || object.type, 
			back: 'object/relation',
			details: {},
		});
	};

	const onDragStart = (e: any, item: any) => {
		e.stopPropagation();

		keyboard.disableSelection(true);
		S.Common.getRef('selectionProvider')?.clear();
		S.Common.getRef('dragProvider')?.onDragStart(e, I.DropType.Relation, [ item.id ], {
			getNode: () => sectionsRef.current[item.id]?.getNode(),
		});
	};

	const onLocal = (e: MouseEvent, item: any) => {
		const { x, y } = keyboard.mouse.page;
		const isTemplate = U.Object.isTemplateType(object.type);
		const type = S.Record.getTypeById(isTemplate ? object.targetObjectType : object.type);

		S.Menu.open('select', {
			rect: { width: 0, height: 0, x: x + 4, y },
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			data: {
				options: [
					{ id: 'addToType', name: translate('sidebarRelationLocalAddToType'), icon: '' },
					{ id: 'remove', name: translate('sidebarRelationLocalRemoveFromObject'), color: 'red' },
				],
				onSelect: (e, option) => {
					switch (option.id) {
						case 'addToType': {
							if (!type) {
								break;
							};

							C.ObjectListSetDetails([ type.id ], [ { key: 'recommendedRelations', value: type.recommendedRelations.concat([ item.id ]) || [] } ]);
							break;
						};

						case 'remove': {
							C.ObjectRelationDelete(object.id, [ item.relationKey ]);
							break;
						};
					};
				},
			},
		});
	};

	const onAdd = (e: any) => {
		const keys = sections.reduce((acc, it) => {
			const keys = it.children.map((it) => it.relationKey);
			return acc.concat(keys);
		}, []);

		S.Menu.open('relationSuggest', { 
			element: $(e.currentTarget),
			horizontal: I.MenuDirection.Center,
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			data: {
				filter: '',
				rootId: object.id,
				ref: 'type',
				menuIdEdit: 'blockRelationEdit',
				skipKeys: keys,
				addCommand: (rootId: string, blockId: string, relation: any, onChange: (message: any) => void) => {
					C.ObjectRelationAdd(rootId, [ relation.relationKey ], onChange);
				},
			}
		});
	};

	const initToggle = (id: string, isOpen: boolean) => {
		const obj = $(`#sidebarRight #relationGroup-${id}`);
		const title = obj.find('.titleWrap');
		const list = obj.find('> .list');

		title.toggleClass('isOpen', isOpen);
		list.toggleClass('isOpen', isOpen).css({ height: (isOpen ? 'auto': 0) });
	};

	const onToggle = (id: string) => {
		const obj = $(`#sidebarRight #relationGroup-${id}`);
		const title = obj.find('.titleWrap');
		const list = obj.find('> .list');
		const isOpen = list.hasClass('isOpen');

		U.Common.toggle(list, 200, isOpen);
		title.toggleClass('isOpen', !isOpen);
		Storage.setToggle(page, id, !isOpen);

		analytics.event('ScreenObjectRelationToggle', { type: isOpen ? 'Collapse' : 'Extend' });
	};

	const sections = getSections();

	useEffect(() => {
		analytics.event('ScreenObjectRelation');

		sections.filter(it => it.withToggle).forEach(section => {
			const toggle = Storage.checkToggle(page, section.id);

			initToggle(section.id, toggle);
		});
	}, []);

	useImperativeHandle(ref, () => ({
		forceUpdate: () => setDummy(dummy + 1),
	}));

	return (
		<>
			<div id="head" className="head">
				<div className="side left" />
				<div className="side center">
					<Label text={translate('sidebarTypeRelation')} />
				</div>

				{allowTypeDetails ? (
					<div className="side right">
						<Button color="dark" text={translate('sidebarObjectRelationSetUp')} className="c28" onClick={onSetUp} />
					</div>
				) : ''}
			</div>

			<div id="body" className="body">
				{type?.isDeleted ? (
					<div className="section">
						<div className="item empty">
							{translate('sidebarObjectRelationTypeDeleted')}
						</div>
					</div>
				) : ''}

				{sections.map((section, i) => {
					const { id, name, description, withToggle } = section;
					const cnt = [ 'titleWrap' ];
					const cnl = [ 'list' ];

					if (withToggle) {
						cnt.push('withToggle');
						cnl.push('withToggle');
					};

					let button = null;
					if ((id == 'local') && allowObjectDetails && !readonly && !isTemplate) {
						button = (
							<Icon 
								className="plus withBackground" 
								tooltipParam={{ text: translate('commonAddRelation') }}
								onClick={onAdd}
							/>
						);
					};

					return (
						<div id={`relationGroup-${id}`} className="group" key={id}>
							{name ? (
								<div className={cnt.join(' ')}>
									<div className="side left">
										<Label text={name} onClick={withToggle ? () => onToggle(id) : null} />
										{description ? (
											<Icon
												className="question"
												tooltipParam={{ 
													text: description,
													className: 'relationGroupDescription',
													typeX: I.MenuDirection.Right,
													typeY: I.MenuDirection.Center,
													offsetX: -8,
													delay: 0,
												}}
											/>
										) : ''}
									</div>

									<div className="side right">
										{button}
									</div>
								</div>
							) : ''}

							<div className={cnl.join(' ')}>
								{!section.children.length && section.withEmpty ? (
									<div className="section empty">
										{translate('sidebarObjectRelationEmpty')}
									</div>
								) : ''}

								{section.withToggle ? <div /> : ''}

								{section.children.map((item, i) => (
									<Section
										{...props}
										ref={ref => sectionsRef.current[item.id] = ref}
										key={item.id}
										id={item.id}
										component="object/relation"
										rootId={rootId}
										object={object}
										item={item}
										readonly={isReadonly}
										onDragStart={e => onDragStart(e, item)}
									/>
								))}
							</div>
						</div>
					);
				})}
			</div>
		</>
	);

}));

export default SidebarPageObjectRelation;