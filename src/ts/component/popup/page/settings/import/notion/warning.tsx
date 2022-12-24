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

	render () {
		return (
			<div>
				<Head {...this.props} returnTo="importNotion" name={translate('commonBack')} />
				<Title text="Caution" />
				<Label text="Some data imported from Notion will have differences in Anytype" />

				<div className="listWrapper">
					<ol className="list">
						<li>
							<Label text="Some @persons are mentioned in the imported documents" />
							<Label className="grey" text="Persons names will be written as plain text in Anytype documents." />
						</li>
						<li>
							<Label text="Internal links can be missed" />
							<Label className="grey" text="Links to documents that aren’t included in this export will be converted as a plain text." />
						</li>
						<li>
							<Label text="Databases will be converted into Simple Tables" />
							<Label className="grey" text="Anytype doesn’t support Notion’s format of databases. So that, they will be appear as tables." />
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