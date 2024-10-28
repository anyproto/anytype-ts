import * as React from 'react';
import { observer } from 'mobx-react';
import { Label, Button } from 'Component';
import { I, S, translate, sidebar } from 'Lib';

import SectionTitle from 'Component/sidebar/section/type/title';
import SectionLayout from 'Component/sidebar/section/type/layout';
import SectionRelation from 'Component/sidebar/section/type/relation';

const SidebarPageType = observer(class SidebarPageType extends React.Component<I.SidebarPageComponent> {
	
	node = null;

	constructor (props: I.SidebarPageComponent) {
		super(props);

		this.onSave = this.onSave.bind(this);
		this.onCancel = this.onCancel.bind(this);
	};

    render () {
		const { rootId } = this.props;
		const type = S.Record.getTypeById(rootId);

		console.log(type);

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
					<SectionTitle {...this.props} object={type} />
					<SectionLayout {...this.props} object={type} />
					<SectionRelation {...this.props} object={type} />
				</div>
			</React.Fragment>
		);
	};

	onSave () {
		sidebar.rightPanelToggle(false);
	};

	onCancel () {
		sidebar.rightPanelToggle(false);
	};

});

export default SidebarPageType;