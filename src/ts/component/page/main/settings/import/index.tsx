import React, { forwardRef, useState } from 'react';
import { Icon, Title, Error } from 'Component';
import { I, U, J, translate, Action } from 'Lib';
import { observer } from 'mobx-react';

interface Props extends I.PageSettingsComponent {
	onImport: (type: I.ImportType, param: any) => void;
};

const PageMainSettingsImportIndex = observer(forwardRef<I.PageRef, Props>((props, ref) => {

	const { onPage } = props;
	const [ error, setError ] = useState('');
	const items = U.Menu.getImportFormats();
	const apps = items.filter(it => it.isApp);
	const others = items.filter(it => !it.isApp);

	const onClick = (id: string) => {
		const item = items.find(it => it.id == id);
		const common = [ I.ImportType.Html, I.ImportType.Text, I.ImportType.Protobuf, I.ImportType.Markdown ];

		if (common.includes(item.format)) {
			Action.import(item.format, J.Constant.fileExtension.import[item.format], {}, (message: any) => {
				if (message.error.code) {
					setError(message.error.description);
				} else {
					U.Space.openDashboard();
				};
			});
		} else {
			onPage(U.String.toCamelCase(`import-${item.id}`));
		};
	};

	const Item = (item: any) => {
		const cn = [ 'item', item.id ];

		if (item.isApp) {
			cn.push('isApp');
		};

		return (
			<div className={cn.join(' ')} onClick={() => onClick(item.id)} >
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

				<Error text={error} />
			</div>
		</>
	);

}));

export default PageMainSettingsImportIndex;
