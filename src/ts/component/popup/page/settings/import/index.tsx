import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Icon, Title, Label } from 'ts/component';
import { I, Util, translate } from 'ts/lib';
import { observer } from 'mobx-react';

import Head from '../head';

interface Props extends I.Popup, RouteComponentProps<any> {
	prevPage: string;
	onPage: (id: string) => void;
	onImport: (format: I.ImportFormat) => void;
};

const PopupSettingsPageImportIndex = observer(class PopupSettingsPageImportIndex extends React.Component<Props, {}> {

	render () {
		const { onPage } = this.props;
		const items = [
			{ id: 'notion', name: 'Notion', disabled: false },
			{ id: 'evernote', name: 'Evernote', disabled: true },
			{ id: 'roam', name: 'Roam Research', disabled: true },
			{ id: 'word', name: 'Word', disabled: true },
			{ id: 'text', name: 'Text & Markdown', disabled: true },
			{ id: 'html', name: 'HTML', disabled: true },
			{ id: 'csv', name: 'CSV', disabled: true },
		];

		const Item = (item: any) => {
			let cn = [ 'item', item.id ];
			let onClick = () => { onPage(Util.toCamelCase('import-' + item.id)); };
			
			if (item.disabled) {
				cn.push('disabled');
				onClick = null;
			};

			return (
				<div className={cn.join(' ')} onClick={onClick} >
					{item.disabled ? <div className="soon">{translate('commonSoon')}</div> : ''}
					<div className="txt">
						<Icon />
						<div className="name">{item.name}</div>
					</div>
				</div>
			);
		};

		return (
			<div>
				<Head {...this.props} id="index" name={translate('popupSettingsTitle')} />

				<Title text={translate('popupSettingsImportTitle')} />
				<Label text={translate('popupSettingsImportText')} />

				<div className="items">
					{items.map((item: any, i: number) => (
						<Item key={i} {...item} />
					))}
				</div>
			</div>
		);
	};

});

export default PopupSettingsPageImportIndex;