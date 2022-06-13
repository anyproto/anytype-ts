import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Icon, Title, Label } from 'ts/component';
import { I, translate } from 'ts/lib';
import { authStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Popup, RouteComponentProps<any> {
	prevPage: string;
	onPage: (id: string) => void;
};

const PopupSettingsPageIndex = observer(class PopupSettingsPageIndex extends React.Component<Props, {}> {

	render () {
		const { onPage } = this.props;

		return (
			<div>
				<Title text={translate('popupSettingsTitle')} />

				<div className="rows">
					<div className="row" onClick={() => { onPage('account'); }}>
						<Icon className="account" />
						<Label text={translate('popupSettingsAccountTitle')} />
						<Icon className="arrow" />
					</div>

					<div className="row" onClick={() => { onPage('personal'); }}>
						<Icon className="personal" />
						<Label text={translate('popupSettingsPersonalTitle')} />
						<Icon className="arrow" />
					</div>

					<div className="row" onClick={() => { onPage('appearance'); }}>
						<Icon className="appearance" />
						<Label text={translate('popupSettingsAppearanceTitle')} />
						<Icon className="arrow" />
					</div>

					<div className="row" onClick={() => { onPage('importIndex'); }}>
						<Icon className="import" />
						<Label text={translate('popupSettingsImportTitle')} />
						<Icon className="arrow" />
					</div>

					<div className="row" onClick={() => { onPage('exportMarkdown'); }}>
						<Icon className="export" />
						<Label text={translate('popupSettingsExportTitle')} />
						<Icon className="arrow" />
					</div>
				</div>
			</div>
		);
	};

});

export default PopupSettingsPageIndex;