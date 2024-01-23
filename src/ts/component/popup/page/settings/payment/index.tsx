import * as React from 'react';
import { Title, Label } from 'Component';
import { I, translate } from 'Lib';
import { observer } from 'mobx-react';

const PopupSettingsPagePaymentIndex = observer(class PopupSettingsPagePaymentIndex extends React.Component<I.PopupSettings> {

	render () {
		const { onPage } = this.props;

		return (
			<React.Fragment>
				<Title text={translate('popupSettingsPaymentTitle')} />
				<Label className="description" text={translate('popupSettingsPaymentIndexText')} />

				<div className="items">
					<div className="item" onClick={() => onPage('paymentItem', { itemId: 1 })} />
					<div className="item" />
					<div className="item" />
				</div>
			</React.Fragment>
		);
	};

});

export default PopupSettingsPagePaymentIndex;