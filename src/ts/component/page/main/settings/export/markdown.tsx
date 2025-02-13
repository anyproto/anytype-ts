import * as React from 'react';
import { Title, Label, Button, Switch } from 'Component';
import { I, translate, Storage } from 'Lib';
import { observer } from 'mobx-react';

const PageMainSettingsExportMarkdown = observer(class PageMainSettingsExportMarkdown extends React.Component<I.PageSettingsComponent> {

	data: any = {};

	render () {
		const { onExport } = this.props;
		const items = [
			{ id: 'zip', name: translate('popupExportZipArchive'), control: 'switch' },
			{ id: 'files', name: translate('popupExportIncludeFiles'), control: 'switch' },
			{ id: 'archived', name: translate('popupExportIncludeArchivedObjects'), control: 'switch' },
		];

		this.init();

		return (
			<>
				<Title text={translate('popupSettingsExportMarkdownTitle')} />

				<div className="labels">
					<Label text={translate('popupSettingsExportMarkdownText1')} />
					<Label text={translate('popupSettingsExportMarkdownText2')} />
				</div>

				<div className="actionItems">
					{items.map((item: any, i: number) => (
						<div key={i} className="item">
							<Label text={item.name} />

							<Switch
								className="big"
								value={this.data[item.id]}
								onChange={(e: any, v: boolean) => {
									this.data[item.id] = v;
									this.save();
								}}
							/>
						</div>
					))}
				</div>

				<div className="buttons">
					<Button 
						text={translate('popupSettingsExportOk')} 
						className="c36"
						onClick={() => onExport(I.ExportType.Markdown, this.data)} 
					/>
				</div>
			</>
		);
	};

	componentDidMount () {
		this.init();
	};

	init () {
		this.data = Storage.get('popupExport') || {};
	};

	save () {
		Storage.set('popupExport', this.data);
	};

});

export default PageMainSettingsExportMarkdown;
