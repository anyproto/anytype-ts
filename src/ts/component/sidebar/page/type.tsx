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
		this.disableButton = this.disableButton.bind(this);
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
							text={type ? translate('commonSave') : translate('commonApply')}
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
							id={item.id}
							component={item.component}
							object={this.object} 
							withState={true}
							onChange={this.onChange}
							disableButton={this.disableButton}
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

	componentWillUnmount (): void {
		this.disableScroll(false);
	}; 

	init () {
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

		this.disableScroll(true);
		this.disableButton(true);
	};

	disableButton (v: boolean) {
		if (this.buttonSaveRef) {
			$(this.buttonSaveRef.getNode()).toggleClass('disabled', v);
		};
	};

	disableScroll (v: boolean) {
		const { isPopup } = this.props;
		const container = isPopup ? U.Common.getScrollContainer(isPopup) : $('body');

		container.toggleClass('overPopup', v);
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
			{ id: 'plural', component: 'type/title' },
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

		if ((undefined !== update.recommendedLayout) && !U.Object.isTypeLayout(this.object.layout)) {
			this.updateLayout(update.recommendedLayout);
		};

		sections.forEach(it => {
			this.updateObject(it.id);
			this.forceUpdate();
		});

		this.disableButton(!U.Common.objectLength(this.update) || (!this.object.name && !this.object.pluralName));

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
		const current = S.Detail.get(rootId, rootId);

		S.Block.update(rootId, rootId, { layout });

		if (!current._empty_) {
			S.Detail.update(rootId, { id: rootId, details: { resolvedLayout: layout } }, false);
		};
	};

	onSave () {
		const { space } = S.Common;
		const { rootId, isPopup, previous } = this.props;
		const details: any = this.props.details || {};
		const type = S.Record.getTypeType();

		if (!U.Common.objectLength(this.update) || (!this.object.name && !this.object.pluralName)) {
			return;
		};

		if (rootId) {
			const update = [];

			for (const key in this.update) {
				const value = Relation.formatValue(S.Record.getRelationByKey(key), this.update[key], true);
				update.push({ key, value });
			};

			if (update.length) {
				C.ObjectListSetDetails([ rootId ], update, () => {
					C.BlockDataviewRelationSet(rootId, J.Constant.blockId.dataview, [ 'name', 'description' ].concat(U.Object.getTypeRelationKeys(rootId)));
				});

				if (previous && previous.page) {
					sidebar.rightPanelSetState(isPopup, previous);
				} else {
					this.close();
				};
			};
		} else {
			C.ObjectCreate(this.object, [], '', type.uniqueKey, space, true, (message) => {
				if (!message.error.code) {
					const route = details.data && details.data.route ? details.data.route : '';
					const format = I.LayoutFormat[this.object.layoutFormat];

					U.Object.openRoute(message.details);
					S.Common.getRef('sidebarLeft')?.refChild?.refFilter?.setValue('');

					analytics.event('CreateObject', { objectType: J.Constant.typeKey.type, route, format });
				};
			});

			this.close();
		};

		this.update = {};

		analytics.event('ClickSaveEditType', { objectType: rootId });
		analytics.stackSend();
	};

	onCancel () {
		const { isPopup, previous } = this.props;
		const rootId = keyboard.getRootId();

		if (U.Common.objectLength(this.update)) {
			S.Detail.update(J.Constant.subId.type, { id: this.backup.id, details: this.backup }, false);

			if ((rootId != this.backup.id) && !U.Object.isTypeLayout(this.backup.layout)) {
				this.updateLayout(this.backup.recommendedLayout);
			};
		};

		if (previous && previous.page) {
			sidebar.rightPanelSetState(isPopup, previous);
		} else {
			this.close();
		};
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
