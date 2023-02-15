import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Title, Label, Icon } from 'Component';
import { I, translate } from 'Lib';

import Head from '../../head';

interface Props extends I.Popup, RouteComponentProps<any> {
	prevPage: string;
	onPage: (id: string) => void;
	onImport: (type: I.ImportType, param: any, callBack?: (message: any) => void) => void;
};

class PopupSettingsPageImportNotionHelp extends React.Component<Props> {

	render () {
		return (
			<div>
				<Head {...this.props} returnTo="importNotion" name={translate('commonBack')} />
				<Icon className="notion" />
				<Title text="How to import from Notion" />
				
				<Label className="step" text="Step 1" />
				<ol className="list">
					<li>
						Open Settings and members
						<img src="./img/help/notion/1-1.png" />
					</li>
					<li>
						Open My Connections and then Develop or manage integrations
						<img src="./img/help/notion/1-2.png" />
					</li>
					<li>
						Click New integration or Create new integration
						<img src="./img/help/notion/1-3.png" />
					</li>
					<li>
						Create a name (e.g. Anytype). Check the Capabilities (Read content and Read user information are required for the integration process). 
						<img src="./img/help/notion/1-4.png" />
					</li>
					<li>
						You integration will be created permanently. Internal integration Token requires for connecting and importing your content from Notion. Copy it.
						<img src="./img/help/notion/1-5.png" />
					</li>
				</ol>

				<Label className="step" text="Step 2" />
				<ol className="list">
					<li>
						Select the pages you want to import into Anytype. Click on three dots on the upper right corner, then Add connections. Select your Anytype integration.
						<img src="./img/help/notion/2-1.png" />
					</li>
					<li>
						Press Confirm. Now you just need to paste your Internal integration Token to Anytype.
						<img src="./img/help/notion/2-2.png" />
					</li>
				</ol>
			</div>
		);
	};

	componentDidMount(): void {
		const { getId, position } = this.props;
		const obj = $(`#${getId()}-innerWrap`);
		const wh = $(window).height();

		obj.css({ width: 864, height: wh - 96 }).addClass('scroll');
		position();
	};

	componentWillUnmount(): void {
		const { getId, position } = this.props;
		const obj = $(`#${getId()}-innerWrap`);

		obj.css({ width: '', height: '' }).removeClass('scroll');
		position();
	};

};

export default PopupSettingsPageImportNotionHelp;