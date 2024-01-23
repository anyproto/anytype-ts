import * as React from 'react';
import { Title, Label } from 'Component';
import { I, translate } from 'Lib';
import { observer } from 'mobx-react';

const PopupSettingsPagePaymentItem = observer(class PopupSettingsPagePaymentItem extends React.Component<I.PopupSettings> {

	render () {
		const { onPage, param } = this.props;
		const { data } = param;
		const { itemId } = data;

		return (
			<React.Fragment>
				<Title text={translate(`popupSettingsPaymentItemTitle${itemId}`)} />
				<Label className="description" text={translate(`popupSettingsPaymentItemText${itemId}`)} />

				{itemId}
			</React.Fragment>
		);
	};

});

export default PopupSettingsPagePaymentItem;