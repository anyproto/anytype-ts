import * as React from 'react';
import { Icon, Title, Label } from 'Component';
import { I, U, translate, analytics } from 'Lib';
import { observer } from 'mobx-react';

interface Props extends I.PageSettingsComponent {
	onImport: (type: I.ImportType, param: any) => void;
	onExport: (type: I.ExportType, param: any) => void;
};

const PageMainSettingsExportIndex = observer(class PageMainSettingsExportIndex extends React.Component<Props> {

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
			<>
				<Title text={translate('popupSettingsExportTitle')} />
				<Label className="description" text={translate('popupSettingsExportText')} />

				<div className="items">
					{items.map((item: any, i: number) => (
						<Item key={i} {...item} />
					))}
				</div>
			</>
		);
	};

	componentDidMount () {
		analytics.event('ScreenSettingsExportIndex', { route: analytics.route.settingsSpaceIndex });
	};

	onClick (id: string) {
		const { onPage } = this.props;
		const items = this.getItems();
		const item = items.find(it => it.id == id);
		const fn = U.Common.toCamelCase('onExport-' + item.id);

		if (item.skipPage && this[fn]) {
			this[fn]();
		} else {
			onPage(U.Common.toCamelCase('export-' + item.id));
		};
	};

	getItems (): any[] {
		return [
			{ id: 'markdown', name: 'Markdown' },
			{ id: 'protobuf', name: 'Any-Block' },
		];
	};

	onExportCommon (type: I.ExportType, options?: any) {
		const { onExport } = this.props;

		onExport(type, options);
	};

	onExportProtobuf () {
		this.onExportCommon(I.ExportType.Protobuf);
	};

});

export default PageMainSettingsExportIndex;
