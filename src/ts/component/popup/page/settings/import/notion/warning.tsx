import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Title, Label, Button } from 'Component';
import { I, translate } from 'Lib';
import { commonStore } from 'Store';

import Head from '../../head';

interface Props extends I.Popup, RouteComponentProps<any> {
	prevPage: string;
	onPage: (id: string) => void;
	onImport: (type: I.ImportType, param: any, callBack?: (message: any) => void) => void;
};

class PopupSettingsPageImportNotionWarning extends React.Component<Props> {

	constructor (props: Props) {
		super(props);

		this.onImport = this.onImport.bind(this);
	};

	render () {
		return (
			<div>
				<Head {...this.props} returnTo="importNotion" name={translate('commonBack')} />
				<Title text="Caution" />
				<Label text="Some data imported from Notion will have differences in Anytype" />

				<div className="listWrapper">
					<ol className="list">
						<li className="label">
							All <b>@mentions</b> will be converted to text
						</li>
						<li className="label">
							<b>Date range</b> will be imported as text
						</li>
						<li className="label">
							<b>Formulas and rollups</b> will be places as values
						</li>
						<li className="label">
							<b>Databases</b> will look as Objects with Relations in Anytype documents
						</li>
					</ol>
				</div>

				<Button text="Proceed" onClick={this.onImport} />
			</div>
		);
	};

	onImport (): void {
		const { close, onImport } = this.props;

		close();
		onImport(I.ImportType.Notion, { apiKey: commonStore.token });
	};

};

export default PopupSettingsPageImportNotionWarning;