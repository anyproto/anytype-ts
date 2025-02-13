import * as React from 'react';
import { observer } from 'mobx-react';
import { Label, Button, Icon } from 'Component';
import { I, S, U, sidebar, translate, keyboard, Relation, C } from 'Lib';

import Section from 'Component/sidebar/section';

const SidebarPageObjectRelation = observer(class SidebarPageObjectRelation extends React.Component<I.SidebarPageComponent> {
	
	sectionRefs: Map<string, any> = new Map();
	id = '';

	constructor (props: I.SidebarPageComponent) {
		super(props);

		this.onSetUp = this.onSetUp.bind(this);
		this.getObject = this.getObject.bind(this);
		this.onConflict = this.onConflict.bind(this);
	};

    render () {
		const { rootId, readonly } = this.props;
		const object = this.getObject();
		const sections = this.getSections();
		const isReadonly = readonly || !S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Details ]);
		const type = S.Record.getTypeById(object.type);
		const allowDetails = !readonly && S.Block.isAllowed(type.restrictions, [ I.RestrictionObject.Details ]);

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
					{sections.map((section, i) => (
						<div className="group" key={section.id}>
							{section.name ? (
								<div className="sectionName">
									<Label text={section.name} />

									{section.description ? (
										<div className="groupDescription">
											<Icon className="question" />
											<Label text={section.description} />
										</div>
									) : null}
								</div>
							) : null}
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
					))}
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

		let items = (type.recommendedRelations || []).map(it => S.Record.getRelationById(it))
		items = items.filter(it => it && it.relationKey && !it.isArchived);
		items = S.Record.checkHiddenObjects(items);
		items = items.filter(it => !conflictingKeys.includes(it.relationKey));

		const sections = [
			{ id: 'object', children: items },
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
		const object = this.getObject();
		const rootId = object.targetObjectType || object.type;

		sidebar.rightPanelSetState({ page: 'type', rootId, noPreview: true });
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

});

export default SidebarPageObjectRelation;
