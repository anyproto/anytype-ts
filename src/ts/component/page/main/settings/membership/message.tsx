import React, { forwardRef } from 'react';
import { Label } from 'Component';
import { I } from 'Lib';

interface Props extends I.PageSettingsComponent {
	text: string;	
};

const PageMainSettingsMembershipMessage = forwardRef<I.PageRef, Props>((props, ref) => {

	return (
		<div className="messageWrapper">
			<div className="inner">
				<Label text={props.text} />
			</div>
		</div>
	);

});

export default PageMainSettingsMembershipMessage;