import React, { FC } from 'react';
import { Title, Label, Icon, IconObject } from 'Component';
import { I, translate } from 'Lib';

const PopupPhrase: FC<I.Popup> = (props) => {
	
	return (
		<>
			<Icon className="close" onClick={() => props.close()} />

			<Title text={translate('popupPhraseTitle1')} />
			<div className="rows">
				<div className="row">
					<Icon className="gameDie" />
					<dl>
						<dt>{translate('popupPhraseSubTitle1')}</dt>
						<dd>{translate('popupPhraseLabel1')}</dd>
					</dl>
				</div>
				<div className="row">
					<Icon className="scan" />
					<dl>
						<dt>{translate('popupPhraseSubTitle2')}</dt>
						<dd>{translate('popupPhraseLabel2')}</dd>
					</dl>
				</div>
				<div className="row">
					<Icon className="safetyBox" />
					<dl>
						<dt>{translate('popupPhraseSubTitle3')}</dt>
						<dd>{translate('popupPhraseLabel3')}</dd>
					</dl>
				</div>
			</div>
		</>
	);

};

export default PopupPhrase;
