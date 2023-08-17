import * as React from 'react';
import { Icon, Title, Label } from 'Component';
import { I, UtilCommon, translate, analytics, Action } from 'Lib';
import { observer } from 'mobx-react';
import { commonStore } from 'Store';

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
				<div className={[ 'item', item.id ].join(' ')} onClick={() => { this.onClick(item.id); }} >
					<Icon />
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
		const { onPage } = this.props;
		const items = this.getItems();
		const item = items.find(it => it.id == id);
		const fn = UtilCommon.toCamelCase('onImport-' + item.id);

		if (this[fn]) {
			this[fn]();
		} else {
			onPage(UtilCommon.toCamelCase('import-' + item.id));
		};
	};

	getItems () {
		return [
			{ id: 'notion', name: 'Notion' },
			{ id: 'markdown', name: 'Markdown' },
			{ id: 'html', name: 'HTML' },
			{ id: 'text', name: 'TXT' },
			{ id: 'protobuf', name: 'Protobuf' },
			{ id: 'csv', name: 'CSV' },
		];
	};

	onImportCommon (type: I.ImportType, extensions: string[], options?: any) {
		Action.import(type, extensions, options);
		this.props.close();
	};

	onImportHtml () {
		this.onImportCommon(I.ImportType.Html, [ 'zip', 'html', 'htm', 'mhtml' ]);
	};

	onImportText () {
		this.onImportCommon(I.ImportType.Text, [ 'zip', 'txt' ]);
	};

	onImportProtobuf () {
		this.onImportCommon(I.ImportType.Protobuf, [ 'zip', 'pb' ]);
	};

	onImportMarkdown () {
		this.onImportCommon(I.ImportType.Markdown, [ 'zip', 'md' ]);
	};

});

export default PopupSettingsPageImportIndex;