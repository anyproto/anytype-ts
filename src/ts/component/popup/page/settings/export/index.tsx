import * as React from 'react';
import { Icon, Title, Label } from 'Component';
import { I, Util, translate } from 'Lib';
import { observer } from 'mobx-react';

interface Props extends I.PopupSettings {
	onImport: (type: I.ImportType, param: any) => void;
	onExport: (type: I.ExportType, param: any) => void;
};

const PopupSettingsPageExportIndex = observer(class PopupSettingsPageExportIndex extends React.Component<Props> {

	render () {
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
				<Title text={translate('popupSettingsExportTitle')} />
				<Label className="description" text={translate('popupSettingsExportText')} />

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

	onExportCommon (type: I.ExportType, options?: any) {
		const { close, onExport } = this.props;

		onExport(type, options);
		close();
	};

	onExportProtobuf () {
		this.onExportCommon(I.ExportType.Protobuf);
	};

});

export default PopupSettingsPageExportIndex;