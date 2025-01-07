import React, { forwardRef } from 'react';
import { Icon, Title, Label, Button } from 'Component';
import { I, translate, Action, analytics } from 'Lib';

const PageMainVoid = forwardRef<{}, I.PageComponent>(() => {

	return (
		<div className="wrapper">
			<div className="container">
				<div className="iconWrapper">
					<Icon />
				</div>
				<Title text={translate('pageMainVoidTitle')} />
				<Label text={translate('pageMainVoidText')} />
				<Button onClick={() => Action.createSpace(analytics.route.void)} className="c36" text={translate('pageMainVoidCreateSpace')} />
			</div>
		</div>
	);

});

export default PageMainVoid;