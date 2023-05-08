import * as React from 'react';
import { Icon, Title, Label } from 'Component';
import { I, Util, translate } from 'Lib';
import { observer } from 'mobx-react';
import { commonStore } from 'Store';
import Head from '../head';

interface Props extends I.Popup {
	prevPage: string;
	onPage: (id: string) => void;
	onExport: (format: I.ExportFormat, param: any) => void;
};

const PopupSettingsPageImportIndex = observer(class PopupSettingsPageImportIndex extends React.Component<Props> {

	render () {
		const items = this.getItems();

		const Item = (item: any) => {
			return (
				<div className={[ 'item', item.id ].join(' ')} onClick={() => { this.onClick(item.id); }} >
					<div className="txt">
						<Icon />
						<div className="name">{item.name}</div>
					</div>
				</div>
			);
		};

		return (
			<div>
				<Head {...this.props} returnTo="index" name={translate('popupSettingsTitle')} />

				<Title text={translate('popupSettingsExportTitle')} />
				<Label className="center" text={translate('popupSettingsExportText')} />

				<div className="items">
					{items.map((item: any, i: number) => (
						<Item key={i} {...item} />
					))}
				</div>
			</div>
		);
	};

	onClick (id: string) {
		const { onPage } = this.props;
		const items = this.getItems();
		const item = items.find(it => it.id == id);
		const fn = Util.toCamelCase('onExport-' + item.id);

		if (item.skipPage && this[fn]) {
			 this[fn]();
		} else {
			onPage(Util.toCamelCase('export-' + item.id));
		};
	};

	getItems (): any[] {
		return [
			{ id: 'markdown', name: 'Markdown' },
			{ id: 'protobuf', name: 'Protobuf' },
		];
	};

});

export default PopupSettingsPageImportIndex;