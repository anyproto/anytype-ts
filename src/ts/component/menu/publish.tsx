import React, { forwardRef, useEffect } from 'react';
import { Title, Input, Label, Switch, Button } from 'Component';
import { I, translate } from 'Lib';

const MenuPublish = forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	useEffect(() => {
	}, []);

	return (
		<>
			<Title text={translate('menuPublishTitle')} />
			<Input value="fuksman.any.coop" />
			<Input value="/rem-koolhaas-architects" />
			<Label className="small" text="https:/any.copp/kjshdfkjahsjdkhAJDH*78/rem-koolhaas-architects" />

			<div className="flex">
				<Label text={translate('menuPublishLabel')} />
				<div className="value">
					<Switch />
				</div>
			</div>

			<Button text={translate('menuPublishButton')} className="c36" />
		</>
	);

});

export default MenuPublish;