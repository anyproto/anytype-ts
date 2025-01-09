import * as React from 'react';
import { observer } from 'mobx-react';
import { Label, Button } from 'Component';
import { I, S, C, U, J, Relation, translate, sidebar } from 'Lib';

import Section from 'Component/sidebar/section';
import SidebarLayoutPreview from 'Component/sidebar/preview';

const SidebarPageType = observer(class SidebarPageType extends React.Component<I.SidebarPageComponent> {
	
	object: any = {};
	update: any = {};
	sectionRefs: Map<string, any> = new Map();
	previewRef: any = null;

	constructor (props: I.SidebarPageComponent) {
		super(props);

		this.onChange = this.onChange.bind(this);
		this.onSave = this.onSave.bind(this);
		this.onCancel = this.onCancel.bind(this);
	};

    render () {
		const type = this.getObject();
		const sections = this.getSections();
		const readonly = this.props.readonly || !S.Block.isAllowed(type.restrictions, [ I.RestrictionObject.Details ]);

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
							onChange={update => this.onChange(item.id, update)}
							readonly={readonly}
						/>
					))}
				</div>

				<SidebarLayoutPreview {...this.props} ref={ref => this.previewRef = ref} />
			</>
		);
	};

	componentDidMount (): void {
		this.init();
		window.setTimeout(() => this.previewRef.show(true), J.Constant.delay.sidebar);
	};

	componentDidUpdate (): void {
		this.init();
	};

	componentWillUnmount () {
		const { isPopup } = this.props;
		const container = U.Common.getPageContainer(isPopup);

		S.Common.getRef('sidebarRight')?.setState({ details: {}, rootId: ''});
		container.removeClass('overPopup');
	};

	init () {
		const { isPopup } = this.props;
		const container = U.Common.getPageContainer(isPopup);
		const type = this.getObject();
		const sections = this.getSections();
		const details: any = this.props.details || {};
		const newType = Object.assign({
			recommendedLayout: I.ObjectLayout.Page,
			layoutAlign: I.BlockHAlign.Left,
			layoutWidth: 0,
			layoutFormat: I.LayoutFormat.Page,
			recommendedFeaturedRelations: [],
			defaultView: I.ViewType.Grid,
		}, details);

		this.object = U.Common.objectCopy(details.isNew ? newType : type || newType);
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
		return [
			{ id: 'title', component: 'type/title' },
			{ id: 'layout', component: 'type/layout' },
			{ id: 'relation', component: 'type/relation' },
		];
	};

	onChange (section: string, update: any) {
		for (const relationKey in update) {
			const relation = S.Record.getRelationByKey(relationKey);

			update[relationKey] = Relation.formatValue(relation, update[relationKey], false);
		};

		this.object = Object.assign(this.object, update);
		this.update = Object.assign(this.update, update);
		this.updateObject(section);
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
			C.ObjectListSetDetails([ rootId ], update);
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
		this.close();
	};

	close () {
		this.previewRef.show(false);
		window.setTimeout(() => sidebar.rightPanelToggle(false, this.props.isPopup), J.Constant.delay.sidebar);
	};

	updateObject (id: string) {
		this.sectionRefs.get(id)?.setObject(this.object);
		this.previewRef.update(this.object);
	};

});

export default SidebarPageType;
