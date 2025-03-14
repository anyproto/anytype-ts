import * as React from 'react';
import { observer } from 'mobx-react';
import { Label, Button } from 'Component';
import { I, S, C, U, J, Relation, translate, sidebar, keyboard, analytics } from 'Lib';

import Section from 'Component/sidebar/section';
import SidebarLayoutPreview from 'Component/sidebar/preview';

const SidebarPageType = observer(class SidebarPageType extends React.Component<I.SidebarPageComponent> {
	
	object: any = {};
	update: any = {};
	sectionRefs: Map<string, any> = new Map();
	previewRef: any = null;
	buttonSaveRef: any = null;
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
						<Button 
							color="blank" 
							text={translate('commonCancel')}
							className="c28"
							onClick={this.onCancel}
						/>

						<Button 
							ref={ref => this.buttonSaveRef = ref} 
							text={type ? translate('commonSave') : translate('commonCreate')}
							className="c28" 
							onClick={this.onSave}
						/>
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
		const { noPreview } = this.props;

		this.init();
		window.setTimeout(() => this.previewRef?.show(true), J.Constant.delay.sidebar);

		analytics.event('ScreenEditType', { route: noPreview ? analytics.route.object : analytics.route.type });
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

		$(this.buttonSaveRef.getNode()).addClass('disabled');
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
		const type = S.Record.getTypeById(this.props.rootId);
		const isFile = type ? U.Object.isInFileLayouts(type.recommendedLayout) : false;

		return [
			{ id: 'title', component: 'type/title' },
			!isFile ? { id: 'layout', component: 'type/layout' } : null,
			{ id: 'relation', component: 'type/relation' },
		].filter(it => it);
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

		$(this.buttonSaveRef.getNode()).toggleClass('disabled', !U.Common.objectLength(this.update));

		// analytics
		let eventId = '';
		if (update.recommendedLayout) {
			eventId = 'ChangeRecommendedLayout';
		} else
		if (update.layoutAlign) {
			eventId = 'SetLayoutAlign';
		};

		analytics.stackAdd(eventId, { route: analytics.route.type });
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
		if (!U.Common.objectLength(this.update)) {
			return;
		};

		const { space } = S.Common;
		const { rootId, isPopup, previous } = this.props;
		const type = S.Record.getTypeType();

		if (rootId) {
			const update = [];

			for (const key in this.update) {
				const value = Relation.formatValue(S.Record.getRelationByKey(key), this.update[key], true);
				update.push({ key, value });
			};

			if (update.length) {
				C.ObjectListSetDetails([ rootId ], update);

				if (previous) {
					sidebar.rightPanelSetState(isPopup, previous);
				} else {
					this.close();
				};
			};
		} else {
			C.ObjectCreate(this.object, [], '', type.uniqueKey, space, (message) => {
				if (!message.error.code) {
					U.Object.openRoute(message.details);
					S.Common.getRef('sidebarLeft')?.refChild?.refFilter?.setValue('');
				};
			});

			this.close();
		};

		this.update = {};

		analytics.event('ClickSaveEditType', { objectType: rootId });
		analytics.stackSend();
	};

	onCancel () {
		if (U.Common.objectLength(this.update)) {
			S.Detail.update(J.Constant.subId.type, { id: this.backup.id, details: this.backup }, false);
			this.updateLayout(this.backup.recommendedLayout);
		};

		this.close();
	};

	close () {
		this.previewRef?.show(false);
		sidebar.rightPanelToggle(false, true, this.props.isPopup);
	};

	updateObject (id: string) {
		this.sectionRefs.get(id)?.setObject(this.object);
		this.previewRef?.update(this.object);
	};

});

export default SidebarPageType;
