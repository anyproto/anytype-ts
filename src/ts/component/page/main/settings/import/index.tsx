import * as React from 'react';
import { Icon, Title, Label } from 'Component';
import { I, U, J, translate, Action, analytics, sidebar } from 'Lib';
import { observer } from 'mobx-react';

interface Props extends I.PageSettingsComponent {
	onImport: (type: I.ImportType, param: any) => void;
};

const PageMainSettingsImportIndex = observer(class PageMainSettingsImportIndex extends React.Component<Props> {

	render () {
		const items = this.getItems();
		const apps = items.filter(it => it.isApp);
		const others = items.filter(it => !it.isApp);

		const Item = (item: any) => {
			const cn = [ 'item', item.id ];

			if (item.isApp) {
				cn.push('isApp');
			};

			return (
				<div className={cn.join(' ')} onClick={() => this.onClick(item.id)} >
					<Icon className={`import-${item.id}`} />
					<div className="name">{item.name}</div>
				</div>
			);
		};

		return (
			<>
				<Title text={translate('popupSettingsImportTitle')} />

				<div className="sections">
					<div className="section app">
						<Title className="sub" text={translate('popupSettingsImportByApp')} />
						<div className="items">
							{apps.map((item: any, i: number) => (
								<Item key={i} {...item} />
							))}
						</div>
					</div>

					<div className="section">
						<Title className="sub" text={translate('popupSettingsImportByFormat')} />
						<div className="items">
							{others.map((item: any, i: number) => (
								<Item key={i} {...item} />
							))}
						</div>
					</div>
				</div>
			</>
		);
	};

	onClick (id: string) {
		const { onPage } = this.props;
		const items = this.getItems();
		const item = items.find(it => it.id == id);
		const common = [ I.ImportType.Html, I.ImportType.Text, I.ImportType.Protobuf, I.ImportType.Markdown ];

		if (common.includes(item.format)) {
			Action.import(item.format, J.Constant.fileExtension.import[item.format], {}, (message: any) => {
				if (message.error.code) {
					this.setState({ error: message.error.description });
					return;
				};

				U.Space.openDashboard();
			});
		} else {
			onPage(U.Common.toCamelCase('import-' + item.id));
		};
	};

	getItems () {
		return U.Menu.getImportFormats();
	};

});

export default PageMainSettingsImportIndex;
