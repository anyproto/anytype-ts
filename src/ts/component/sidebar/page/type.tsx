import * as React from 'react';
import { observer } from 'mobx-react';
import { Label, Button } from 'Component';
import { I, S, C, U, Relation, translate, sidebar } from 'Lib';

import Section from 'Component/sidebar/section';

const SidebarPageType = observer(class SidebarPageType extends React.Component<I.SidebarPageComponent> {
	
	node = null;
	details: any = {};
	sectionRefs: Map<string, any> = new Map();

	constructor (props: I.SidebarPageComponent) {
		super(props);

		this.onChange = this.onChange.bind(this);
		this.onSave = this.onSave.bind(this);
		this.onCancel = this.onCancel.bind(this);
	};

    render () {
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
							object={this.details} 
							onChange={(key, value) => this.onChange(item.id, key, value)}
						/>
					))}
				</div>
			</React.Fragment>
		);
	};

	componentDidMount (): void {
		const { rootId } = this.props;
		const type = S.Record.getTypeById(rootId);
		const sections = this.getSections();

		this.details = U.Common.objectCopy(type);
		sections.forEach(it => this.update(it.id));
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

		this.details[relationKey] = Relation.formatValue(relation, value, true);
		this.update(section);
	};

	onSave () {
		const { rootId } = this.props;
		const update = [];

		for (const key in this.details) {
			update.push({ key, value: this.details[key] });
		};

		C.ObjectListSetDetails([ rootId ], update);

		sidebar.rightPanelToggle(false);
	};

	onCancel () {
		sidebar.rightPanelToggle(false);
	};

	update (id: string) {
		this.sectionRefs.get(id)?.setObject(this.details);
	};

});

export default SidebarPageType;