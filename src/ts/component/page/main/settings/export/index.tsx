import React, { forwardRef } from 'react';
import { Icon, Title, Label } from 'Component';
import * as I from 'Interface';

interface Props extends I.PageSettingsComponent {
	onImport: (type: I.ImportType, param: any) => void;
	onExport: (type: I.ExportType, param: any) => void;
};

const PageMainSettingsExportIndex = forwardRef<I.PageRef, Props>((props, ref) => {

	const { onPage } = props;
	const items = [
		{ id: 'markdown', name: 'Markdown' },
		{ id: 'protobuf', name: 'Any-Block', isApp: true },
	];

	const onClick = (id: string) => {
		onPage(U.String.toCamelCase(`export-${id}`));
	};

	const Item = (item: any) => {
		const cn = [ 'item', item.id ];

		if (item.isApp) {
			cn.push('isApp');
		};

		return (
			<div className={cn.join(' ')} onClick={() => onClick(item.id)} >
				<Icon name={`import/${item.id}`} size={item.isApp ? 18 : 40} />
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

});

export default PageMainSettingsExportIndex;