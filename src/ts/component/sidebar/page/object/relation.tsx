import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Label, Button, Icon } from 'Component';
import { I, S, U, sidebar, translate, keyboard, Relation, C, Preview } from 'Lib';
import Section from 'Component/sidebar/section';

const SidebarPageObjectRelation = observer(class SidebarPageObjectRelation extends React.Component<I.SidebarPageComponent, {}> {
	
	sectionRefs: Map<string, any> = new Map();

	constructor (props: I.SidebarPageComponent) {
		super(props);

		this.onSetUp = this.onSetUp.bind(this);
		this.getObject = this.getObject.bind(this);
		this.onConflict = this.onConflict.bind(this);
		this.onToggle = this.onToggle.bind(this);
	};

    render () {
		const { rootId, readonly } = this.props;
		const object = this.getObject();
		const sections = this.getSections();
		const isReadonly = readonly || !S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Details ]);
		const type = S.Record.getTypeById(object.type);
		const restrictions = Relation.getArrayValue(type?.restrictions);
		const allowDetails = !readonly && S.Block.isAllowed(restrictions, [ I.RestrictionObject.Details ]);

        return (
			<>
				<div className="head">
					<div className="side left">
						<Label text={translate('sidebarTypeRelation')} />
					</div>

					{allowDetails ? (
						<div className="side right">
							<Button color="blank" text={translate('sidebarObjectRelationSetUp')} className="simple" onClick={this.onSetUp} />
						</div>
					) : ''}
				</div>

				<div className="body customScrollbar">
					{sections.map((section, i) => {
						const { id, name, description, withToggle } = section;
						const lcn = [];
						const onToggle = withToggle ? () => this.onToggle(id) : null;

						if (withToggle) {
							lcn.push('sectionToggle');
						};

						return (
							<div id={`relationGroup-${id}`} className="group" key={id}>
								{name ? (
									<div className="titleWrap">
										<Label text={name} onClick={onToggle} className={lcn.join(' ')} />

										{description ? (
											<Icon
												className="question withBackground"
												tooltipClassName="relationGroupDescription"
												tooltip={description}
												tooltipX={I.MenuDirection.Right}
												tooltipY={I.MenuDirection.Center}
												tooltipOffsetX={-8}
												tooltipDelay={0}
											/>
										) : ''}
									</div>
								) : ''}

								<div className={[ 'list', (withToggle ? 'withToggle' : '') ].join(' ')}>
									{section.children.map((item, i) => (
										<Section
											{...this.props}
											ref={ref => this.sectionRefs.set(item.id, ref)}
											key={item.id}
											component="object/relation"
											rootId={rootId}
											object={object}
											item={item}
											readonly={isReadonly}
											onDragStart={e => this.onDragStart(e, item)}
										/>
									))}
								</div>
							</div>
						);
					})}
				</div>
			</>
		);
	};

	getObject () {
		const { rootId } = this.props;
		return S.Detail.get(rootId, rootId);
	};

	getSections () {
		const { rootId } = this.props;
		const object = this.getObject();
		const isTemplate = U.Object.isTemplate(object.type);
		const type = S.Record.getTypeById(isTemplate ? object.targetObjectType : object.type) || {};
		const conflicts = S.Record
			.getConflictRelations(rootId, rootId, type.id)
			.sort(U.Data.sortByName)
			.map((it) => ({ ...it, onMore: this.onConflict }));
		const conflictingKeys = conflicts.map(it => it.relationKey);
		const recommendedIds = Relation.getArrayValue(type.recommendedRelations);
		const hiddenIds = Relation.getArrayValue(type.recommendedHiddenRelations);

		let items = recommendedIds.map(it => S.Record.getRelationById(it));
		items = items.filter(it => it && it.relationKey && !it.isArchived);
		items = S.Record.checkHiddenObjects(items);
		items = items.filter(it => !conflictingKeys.includes(it.relationKey));

		let hidden = hiddenIds.map(it => S.Record.getRelationById(it));
		hidden = S.Record.checkHiddenObjects(hidden);
		hidden = hidden.filter(it => it && !(it.isReadonlyValue && Relation.isEmpty(object[it.relationKey])));

		const sections = [
			{ id: 'object', children: items },
			{ id: 'hidden', name: translate('commonShowMore'), children: hidden, withToggle: true },
			{ id: 'conflicts', name: translate('sidebarRelationLocal'), children: conflicts, description: translate('sidebarTypeRelationLocalDescription') }
		];

		return sections.filter(it => it.children.length);
	};

	getRelations () {
		const { rootId } = this.props;
		const object = this.getObject();

		return S.Record.getObjectRelations(rootId, object.type);
	};

	onSetUp () {
		const { isPopup } = this.props;
		const object = this.getObject();
		const rootId = object.targetObjectType || object.type;

		sidebar.rightPanelSetState(isPopup, { page: 'type', rootId, noPreview: true, back: 'object/relation' });
	};

	onDragStart (e: any, item: any) {
		e.stopPropagation();

		const dragProvider = S.Common.getRef('dragProvider');
		const selection = S.Common.getRef('selectionProvider');

		keyboard.disableSelection(true);
		selection?.clear();
		dragProvider?.onDragStart(e, I.DropType.Relation, [ item.id ], this);
	};

	onConflict (e: React.MouseEvent, item: any) {
		const { x, y } = keyboard.mouse.page;
		const object = this.getObject();
		const isTemplate = U.Object.isTemplate(object.type);
		const type = S.Record.getTypeById(isTemplate ? object.targetObjectType : object.type);

		S.Menu.open('select', {
			rect: { width: 0, height: 0, x: x + 4, y },
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			data: {
				options: [
					{ id: 'addToType', name: translate('sidebarRelationLocalAddToCurrentType'), icon: '' },
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

	onToggle (id: string) {
		const obj = $(`#sidebarRight #relationGroup-${id}`);
		const toggle = obj.find('.sectionToggle');
		const list = obj.find('> .list');
		const isOpen = list.hasClass('isOpen');

		U.Common.toggle(list, 200);
		toggle.text(isOpen ? translate('commonShowMore') : translate('commonShowLess'));
	};

});

export default SidebarPageObjectRelation;