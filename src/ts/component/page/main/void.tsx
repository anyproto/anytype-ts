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

				<div className="buttons">
					<Button onClick={() => Action.createSpace(I.SpaceUxType.Space, analytics.route.void)} className="c36" text={translate('commonCreateSpace')} />
					<Button onClick={() => Action.createSpace(I.SpaceUxType.Space, analytics.route.void)} className="c36" text={translate('commonCreateChat')} color="blank" />
				</div>
			</div>
		</div>
	);

});

export default PageMainVoid;
