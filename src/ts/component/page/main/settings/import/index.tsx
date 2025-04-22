import * as React from 'react';
import { Icon, Title, Label } from 'Component';
import { I, U, J, translate, Action, analytics, sidebar } from 'Lib';
import { observer } from 'mobx-react';

interface Props extends I.PageSettingsComponent {
	onImport: (type: I.ImportType, param: any) => void;
};

const PageMainSettingsImportIndex = observer(class PageMainSettingsImportIndex extends React.Component<Props> {

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
				<Title text={translate('popupSettingsImportTitle')} />
				<Label className="description" text={translate('popupSettingsImportText')} />

				<div className="items">
					{items.map((item: any, i: number) => (
						<Item key={i} {...item} />
					))}
				</div>
			</>
		);
	};

	componentDidMount () {
		analytics.event('ScreenSettingsImport', { route: analytics.route.settingsSpaceIndex });
	};

	onClick (id: string) {
		const { onPage } = this.props;
		const items = this.getItems();
		const item = items.find(it => it.id == id);
		const common = [ I.ImportType.Html, I.ImportType.Text, I.ImportType.Protobuf, I.ImportType.Markdown ];

		if (common.includes(item.format)) {
			Action.import(item.format, J.Constant.fileExtension.import[item.format]);

			U.Space.openDashboard();
			sidebar.leftPanelSetState({ page: 'widget' });
		} else {
			onPage(U.Common.toCamelCase('import-' + item.id));
		};
	};

	getItems () {
		return U.Menu.getImportFormats();
	};

});

export default PageMainSettingsImportIndex;
