import * as React from 'react';
import { Icon, Title, Label } from 'Component';
import { I, Util, translate } from 'Lib';
import { observer } from 'mobx-react';
import { commonStore } from 'Store';
import Head from '../head';

interface Props extends I.Popup {
	prevPage: string;
	onPage: (id: string) => void;
	onImport: (type: I.ImportType, param: any) => void;
};

const PopupSettingsPageImportIndex = observer(class PopupSettingsPageImportIndex extends React.Component<Props> {

	render () {
		const { config } = commonStore;
		const { onPage } = this.props;
		
		let items = [
			{ id: 'notion', name: 'Notion' },
			{ id: 'markdown', name: 'Markdown' },
			{ id: 'html', name: 'HTML' },
		];

		if (!config.experimental) {
			items = items.filter(it => [ 'html' ].includes(it.id));
		};

		const Item = (item: any) => {
			return (
				<div className={[ 'item', item.id ].join(' ')} onClick={() => { onPage(Util.toCamelCase('import-' + item.id)); }} >
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