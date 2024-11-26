import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Button } from 'Component';
import { I, S, C, U, Relation, translate, sidebar } from 'Lib';

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

		return (
			<React.Fragment>
				<div className="head">
					<div className="side left">
						<Label text={translate('sidebarTypeTitle')} />
					</div>

					<div className="side right">
						<Button color="blank" text={translate('commonCancel')} className="c28" onClick={this.onCancel} />
						<Button text={translate('commonSave')} className="c28" onClick={this.onSave} />
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
							onChange={(key, value) => this.onChange(item.id, key, value)}
						/>
					))}
				</div>

				<SidebarLayoutPreview ref={ref => this.previewRef = ref} />
			</React.Fragment>
		);
	};

	componentDidMount (): void {
		this.init();
	};

	componentDidUpdate (): void {
		this.init();
	};

	init () {
		const { details } = this.props;
		const type = this.getObject();
		const sections = this.getSections();

		this.object = U.Common.objectCopy(type || details || {});
		sections.forEach(it => this.updateObject(it.id));
	};
	
	getObject () {
		return S.Record.getTypeById(this.props.rootId);
	};

	getSections () {
		return [
			{ id: 'title', component: 'type/title' },
			{ id: 'layout', component: 'type/layout' },
			{ id: 'relation', component: 'type/relation' },
		];
	};

	onChange (section: string, relationKey: string, value: any) {
		const relation = S.Record.getRelationByKey(relationKey);

		console.log('RELATION KEY: ', relationKey)
		console.log('VALUE: ', value)

		value = Relation.formatValue(relation, value, false);

		this.object[relationKey] = value;
		this.update[relationKey] = value;
		this.updateObject(section);
	};

	onSave () {
		const { rootId } = this.props;
		const update = [];

		for (const key in this.update) {
			update.push({ key, value: this.object[key] });
		};
		C.ObjectListSetDetails([ rootId ], update);

		this.update = {};
		this.close();
	};

	onCancel () {
		this.close();
	};

	close () {
		sidebar.rightPanelToggle(false);
		this.previewRef.show(false);
	};

	updateObject (id: string) {
		this.sectionRefs.get(id)?.setObject(this.object);
		this.previewRef.update(this.object);
	};

});

export default SidebarPageType;
