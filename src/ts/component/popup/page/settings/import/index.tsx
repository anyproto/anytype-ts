import * as React from 'react';
import { Icon, Title, Label } from 'Component';
import { I, UtilCommon, translate, Action, UtilMenu } from 'Lib';
import { observer } from 'mobx-react';
const Constant = require('json/constant.json');
import Head from '../head';

interface Props extends I.PopupSettings {
	onImport: (type: I.ImportType, param: any) => void;
};

const PopupSettingsPageImportIndex = observer(class PopupSettingsPageImportIndex extends React.Component<Props> {

	render () {
		const { onPage } = this.props;
		const items = this.getItems();

		const Item = (item: any) => {
			return (
				<div className={[ 'item', item.id ].join(' ')} onClick={() => this.onClick(item.id)} >
					<Icon className={`import-${item.id}`} />
					<div className="name">{item.name}</div>
				</div>
			);
		};

		return (
			<React.Fragment>
				<Head onPage={() => onPage('spaceIndex')} name={translate('commonBack')} />
				<Title text={translate('popupSettingsImportTitle')} />
				<Label className="description" text={translate('popupSettingsImportText')} />

				<div className="items">
					{items.map((item: any, i: number) => (
						<Item key={i} {...item} />
					))}
				</div>
			</React.Fragment>
		);
	};

	onClick (id: string) {
		const { onPage, close } = this.props;
		const items = this.getItems();
		const item = items.find(it => it.id == id);
		const common = [ I.ImportType.Html, I.ImportType.Text, I.ImportType.Protobuf, I.ImportType.Markdown ];

		if (common.includes(item.format)) {
			Action.import(item.format, Constant.fileExtension.import[item.format]);
			close();
		} else {
			onPage(UtilCommon.toCamelCase('import-' + item.id));
		};
	};

	getItems () {
		return UtilMenu.getImportFormats();
	};

});

export default PopupSettingsPageImportIndex;