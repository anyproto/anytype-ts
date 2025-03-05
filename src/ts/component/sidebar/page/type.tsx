import * as React from 'react';
import { observer } from 'mobx-react';
import { Label, Button } from 'Component';
import { I, S, C, U, J, Relation, translate, sidebar, keyboard } from 'Lib';

import Section from 'Component/sidebar/section';
import SidebarLayoutPreview from 'Component/sidebar/preview';

const SidebarPageType = observer(class SidebarPageType extends React.Component<I.SidebarPageComponent> {
	
	object: any = {};
	update: any = {};
	sectionRefs: Map<string, any> = new Map();
	previewRef: any = null;
	conflictIds: string[] = [];
	backup: any = {};

	constructor (props: I.SidebarPageComponent) {
		super(props);

		this.onChange = this.onChange.bind(this);
		this.onSave = this.onSave.bind(this);
		this.onCancel = this.onCancel.bind(this);
	};

    render () {
		const { noPreview } = this.props;
		const type = this.getObject();
		const sections = this.getSections();
		const readonly = this.props.readonly || !S.Block.isAllowed(type?.restrictions, [ I.RestrictionObject.Details ]);

		return (
			<>
				<div className="head">
					<div className="side left">
						<Label text={translate('sidebarTypeTitle')} />
					</div>

					<div className="side right">
						<Button color="blank" text={translate('commonCancel')} className="c28" onClick={this.onCancel} />
						<Button text={type ? translate('commonSave') : translate('commonCreate')} className="c28" onClick={this.onSave} />
					</div>
				</div>

				<div className="body customScrollbar">
					{sections.map((item, i) => (
						<Section 
							{...this.props} 
							ref={ref => this.sectionRefs.set(item.id, ref)}
							key={item.id} 
							component={item.component}
							object={this.object} 
							withState={true}
							onChange={this.onChange}
							readonly={readonly}
						/>
					))}
				</div>

				{!noPreview ? <SidebarLayoutPreview {...this.props} ref={ref => this.previewRef = ref} /> : ''}
			</>
		);
	};

	componentDidMount (): void {
		this.init();
		this.loadConflicts();

		window.setTimeout(() => this.previewRef?.show(true), J.Constant.delay.sidebar);
	};

	componentWillUnmount () {
		const { isPopup } = this.props;
		const container = U.Common.getPageFlexContainer(isPopup);

		sidebar.rightPanelRef(isPopup)?.setState({ details: {}, rootId: ''});
		container.removeClass('overPopup');
	};

	init () {
		const { isPopup } = this.props;
		const container = U.Common.getPageFlexContainer(isPopup);
		const type = this.getObject();
		const sections = this.getSections();
		const details: any = this.props.details || {};
		const newType = Object.assign({
			recommendedLayout: I.ObjectLayout.Page,
			layoutAlign: I.BlockHAlign.Left,
			layoutWidth: 0,
			layoutFormat: I.LayoutFormat.Page,
			recommendedFeaturedRelations: [],
			defaultViewType: I.ViewType.Grid,
		}, details);

		this.object = U.Common.objectCopy(details.isNew ? newType : type || newType);
		this.backup = U.Common.objectCopy(this.object);

		sections.forEach(it => this.updateObject(it.id));

		container.addClass('overPopup');
	};
	
	getObject () {
		const type = S.Record.getTypeById(this.props.rootId);
		if (!type) {
			return null;
		};

		const isList = U.Object.isInSetLayouts(type.recommendedLayout);

		return Object.assign(type, { layoutFormat: isList ? I.LayoutFormat.List : I.LayoutFormat.Page });
	};

	getSections () {
		const sections = [
			{ id: 'title', component: 'type/title' },
			{ id: 'layout', component: 'type/layout' },
			{ id: 'relation', component: 'type/relation' },
		];

		if (this.getConflicts().length) {
			sections.push({ id: 'conflict', component: 'type/conflict' });
		};

		return sections;
	};

	onChange (update: any) {
		const sections = this.getSections();
		const skipFormat = [ 'defaultTypeId' ];

		for (const relationKey in update) {
			if (skipFormat.includes(relationKey)) {
				continue;
			};

			const relation = S.Record.getRelationByKey(relationKey);

			update[relationKey] = Relation.formatValue(relation, update[relationKey], false);
		};

		this.object = Object.assign(this.object, update);
		this.update = Object.assign(this.update, update);

		S.Detail.update(J.Constant.subId.type, { id: this.object.id, details: update }, false);

		if (undefined !== update.recommendedLayout) {
			this.updateLayout(update.recommendedLayout);
		};

		sections.forEach(it => {
			this.updateObject(it.id);
			this.forceUpdate();
		});
	};

	updateLayout (layout: I.ObjectLayout) {
		const rootId = keyboard.getRootId();
		const root = S.Block.getLeaf(rootId, rootId);
		const current = S.Detail.get(rootId, rootId);

		if (root) {
			S.Block.update(rootId, rootId, { layout });
		};

		if (!current._empty_) {
			S.Detail.update(rootId, { id: rootId, details: { resolvedLayout: layout } }, false);
		};
	};

	onSave () {
		const { space } = S.Common;
		const { rootId } = this.props;
		const type = S.Record.getTypeType();

		if (rootId) {
			const update = [];
			for (const key in this.update) {
				update.push({ key, value: this.object[key] });
			};
			if (update.length) {
				C.ObjectListSetDetails([ rootId ], update);
			};
		} else {
			C.ObjectCreate(this.object, [], '', type.uniqueKey, space, (message) => {
				if (!message.error.code) {
					U.Object.openRoute(message.details);
					S.Common.getRef('sidebarLeft')?.refChild?.refFilter?.setValue('');
				};
			});
		};

		this.update = {};
		this.close();
	};

	onCancel () {
		S.Detail.update(J.Constant.subId.type, { id: this.backup.id, details: this.backup }, false);
		this.updateLayout(this.backup.recommendedLayout);
		this.close();
	};

	close () {
		this.previewRef?.show(false);
		window.setTimeout(() => sidebar.rightPanelToggle(false, true, this.props.isPopup), J.Constant.delay.sidebar);
	};

	updateObject (id: string) {
		this.sectionRefs.get(id)?.setObject(this.object);
		this.previewRef?.update(this.object);
	};

	loadConflicts () {
		const { space } = S.Common;
		const type = this.getObject();

		if (!type) {
			return;
		};

		C.ObjectTypeListConflictingRelations(type.id, space, (message) => {
			if (message.error.code) {
				return;
			};

			this.conflictIds = Relation.getArrayValue(message.conflictRelationIds)
				.map(id => S.Record.getRelationById(id))
				.filter(it => it && !Relation.isSystem(it.relationKey))
				.map(it => it.id);

			this.forceUpdate();
		});
	};

	getConflicts () {
		const relationIds = S.Detail.getTypeRelationIds(this.object.id);
		return this.conflictIds.slice(0).filter(it => !relationIds.includes(it));
	};

});

export default SidebarPageType;
