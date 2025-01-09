import * as React from 'react';
import { observer } from 'mobx-react';
import { Label, Button } from 'Component';
import { I, S, U, sidebar, translate } from 'Lib';

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
						<React.Fragment key={section.id}>
							<div key={section.id} className="sectionName">
								{section.name}
							</div>

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
								/>
							))}
						</React.Fragment>
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
		const conflicts = S.Record.getConflictRelations(rootId, rootId, type.id).sort(U.Data.sortByName);
		const conflictingKeys = conflicts.map(it => it.relationKey);

		let items = (type.recommendedRelations || []).map(it => S.Record.getRelationById(it)).filter(it => it && it.relationKey);
		items = S.Record.checkHiddenObjects(items);
		items = items.filter(it => !conflictingKeys.includes(it.relationKey));

		const sections = [
			{ 
				id: 'object', name: translate('menuBlockRelationViewInThisObject'),
				children: items,
			},
			{
				id: 'conflicts', name: translate('menuBlockRelationViewConflictingRelations'),
				children: conflicts,
			}
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
		sidebar.rightPanelSetState({ page: 'type', rootId: object.type });
	};

});

export default SidebarPageObjectRelation;
