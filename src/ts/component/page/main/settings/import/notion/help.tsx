import * as React from 'react';
import { Title, Label, Icon } from 'Component';
import { I, U, translate } from 'Lib';

class PageMainSettingsImportNotionHelp extends React.Component<I.PageSettingsComponent> {

	render () {
		return (
			<div>
				<Icon className="logo" />
				<Title text={translate('popupSettingsImportNotionHelpTitle')} />
				
				<Label className="step" text={U.Common.sprintf(translate('popupSettingsImportNotionHelpStep'), 1)} />
				<ol className="list">
					<li>
						<Label text={translate('popupSettingsImportNotionHelpStep11')} />
						<img src="./img/help/notion/1-1.png" />
					</li>
					<li>
						<Label text={translate('popupSettingsImportNotionHelpStep12')} />
						<img src="./img/help/notion/1-2.png" />
					</li>
					<li>
						<Label text={translate('popupSettingsImportNotionHelpStep13')} />
						<img src="./img/help/notion/1-3.png" />
					</li>
					<li>
						<Label text={translate('popupSettingsImportNotionHelpStep14')} />
						<img src="./img/help/notion/1-4.png" />
					</li>
					<li>
						<Label text={translate('popupSettingsImportNotionHelpStep15')} />
						<img src="./img/help/notion/1-5.png" />
					</li>
					<li>
						<Label text={translate('popupSettingsImportNotionHelpStep16')} />
						<img src="./img/help/notion/1-6.png" />
					</li>
				</ol>

				<Label className="step" text={U.Common.sprintf(translate('popupSettingsImportNotionHelpStep'), 2)} />
				<Label className="stepDescription" text={translate('popupSettingsImportNotionHelpStep2Descr')} />
				<ol className="list">
					<li>
						<Label text={translate('popupSettingsImportNotionHelpStep21')} />
						<img src="./img/help/notion/2-1.png" />
					</li>
					<li>
						<Label text={translate('popupSettingsImportNotionHelpStep22')} />
						<img src="./img/help/notion/2-2.png" />
					</li>
				</ol>
			</div>
		);
	};

};

export default PageMainSettingsImportNotionHelp;
