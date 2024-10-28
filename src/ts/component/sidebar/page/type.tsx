import * as React from 'react';
import { observer } from 'mobx-react';
import { Label, Button } from 'Component';
import { I, S, translate } from 'Lib';

import SectionTitle from 'Component/sidebar/section/title';
import SectionLayout from 'Component/sidebar/section/layout';

const SidebarPageType = observer(class SidebarPageType extends React.Component<I.SidebarPageComponent> {
	
	node = null;

	constructor (props: I.SidebarPageComponent) {
		super(props);

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
						<Button color="blank" text={translate('commonCancel')} className="c28" />
						<Button text={translate('commonSave')} className="c28" />
					</div>
				</div>

				<div className="body customScrollbar">
					<SectionTitle {...this.props} object={type} />
					<SectionLayout {...this.props} object={type} />
					<div className="section"></div>
				</div>
			</React.Fragment>
		);
    };

});

export default SidebarPageType;