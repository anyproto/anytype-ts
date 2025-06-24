import * as React from 'react';
import { Title, Button, Label, Icon } from 'Component';
import { I, U, J, translate, Action } from 'Lib';

interface State {
	error: string;
};

class PageMainSettingsImportObsidian extends React.Component<I.PageSettingsComponent, State> {

	ref = null;
	state: State = {
		error: '',
	};

	constructor (props: I.PageSettingsComponent) {
		super(props);

		this.onImport = this.onImport.bind(this);
	};

	render () {
		const { onPage } = this.props;
		const { error } = this.state;

		return (
			<>
				<Icon className="logo" />
				<Title text={U.Menu.getImportNames()[I.ImportType.Obsidian]} />
				<Label className="description" text={translate('popupSettingsImportObsidianDescription')} />

				<div className="inputWrapper flex">
					<Button text={translate('popupSettingsImportFiles')} className="c36" onClick={this.onImport} />
				</div>

				<div className="line" />

				<div className="helpWrapper flex">
					<Title text={translate('popupSettingsImportObsidianHowTo')} />
				</div>

				<ol className="list">
					<li>
						<Label text={translate('popupSettingsImportObsidianList11')} />
						<Label className="grey" text={translate('popupSettingsImportObsidianList12')} />
					</li>
					<li>
						<Label text={translate('popupSettingsImportObsidianList21')} />
						<Label className="grey" text={translate('popupSettingsImportObsidianList22')} />
					</li>
					<li>
						<Label text={translate('popupSettingsImportObsidianList31')} />
						<Label className="grey" text={translate('popupSettingsImportObsidianList32')} />
					</li>
				</ol>
			</>
		);
	};
	
	onImport (): void {
		Action.import(I.ImportType.Obsidian, J.Constant.fileExtension.import[I.ImportType.Markdown], {}, (message: any) => {
			if (message.error.code) {
				this.setState({ error: message.error.description });
				return;
			};

			U.Space.openDashboard();
		});
	};

};

export default PageMainSettingsImportObsidian;
