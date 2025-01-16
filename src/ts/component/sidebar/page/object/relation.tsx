import * as React from 'react';
import { observer } from 'mobx-react';
import { Label, Button, Icon } from 'Component';
import { I, S, U, sidebar, translate, keyboard, Relation } from 'Lib';

import Section from 'Component/sidebar/section';

const SidebarPageObjectRelation = observer(class SidebarPageObjectRelation extends React.Component<I.SidebarPageComponent> {
	
	sectionRefs: Map<string, any> = new Map();
	id = '';

	constructor (props: I.SidebarPageComponent) {
		super(props);

		this.onSetUp = this.onSetUp.bind(this);
	};

    render () {
		const { rootId } = this.props;
		const object = this.getObject();
		const sections = this.getSections();
		const readonly = this.props.readonly || !S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Details ]);

        return (
			<>
				<div className="head">
					<div className="side left">
						<Label text={translate('sidebarTypeRelation')} />
					</div>

					<div className="side right">
						<Button color="blank" text={translate('sidebarObjectRelationSetUp')} className="simple" onClick={this.onSetUp} />
					</div>
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
									readonly={readonly}
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

		let items = (type.recommendedRelations || []).map(it => S.Record.getRelationById(it)).filter(it => it && it.relationKey);
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
		sidebar.rightPanelSetState({ page: 'type', rootId: object.type, noPreview: true });
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

		S.Menu.open('select', {
			rect: { width: 0, height: 0, x: x + 4, y },
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			data: {
				options: [
					{ id: 'addToType', name: translate('sidebarRelationLocalAddToCurrentType'), icon: '' },
					{ id: 'remove', name: translate('sidebarRelationLocalRemoveFromObjects'), color: 'red' },
				],
				onSelect: (e, option) => {
					switch (option.id) {
						case 'addToType': {
							console.log('ADD')
							break;
						};

						case 'remove': {
							console.log('REMOVE')
							break;
						};
					};
				},
			},
		});
	};

});

export default SidebarPageObjectRelation;
