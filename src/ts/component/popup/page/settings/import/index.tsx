import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Icon, Title, Label } from 'Component';
import { I, Util, translate } from 'Lib';
import { observer } from 'mobx-react';

import Head from '../head';

interface Props extends I.Popup, RouteComponentProps<any> {
	prevPage: string;
	onPage: (id: string) => void;
	onImport: (type: I.ImportType, param: any) => void;
};

const PopupSettingsPageImportIndex = observer(class PopupSettingsPageImportIndex extends React.Component<Props, object> {

	render () {
		const { onPage } = this.props;
		const items = [
			{ id: 'notion', name: 'Notion', disabled: false },
			{ id: 'markdown', name: 'Markdown', disabled: false },
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
				<Head {...this.props} returnTo="index" name={translate('popupSettingsTitle')} />

				<Title text={translate('popupSettingsImportTitle')} />
				<Label className="center" text={translate('popupSettingsImportText')} />

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