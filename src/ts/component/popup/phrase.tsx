import React, { FC } from 'react';
import { Title, Label, Button, IconObject } from 'Component';
import { I, translate } from 'Lib';

const PopupPhrase: FC<I.Popup> = (props) => {
	
	return (
		<>
			<Title text={translate('popupPhraseTitle1')} />
			<div className="rows">
				<div className="row">
					<IconObject size={40} iconSize={40} object={{ iconEmoji: ':game_die:' }} />
					<Label text={translate('popupPhraseLabel1')} />
				</div>
				<div className="row">
					<IconObject size={40} iconSize={40} object={{ iconEmoji: ':old_key:' }} />
					<Label text={translate('popupPhraseLabel2')} />
				</div>
				<div className="row">
					<IconObject size={40} iconSize={40} object={{ iconEmoji: ':point_up:' }} />
					<Label text={translate('popupPhraseLabel3')} />
				</div>
			</div>

			<Title className="c2" text={translate('popupPhraseTitle2')} />
			<div className="columns">
				<div className="column">
					<li>{translate('popupPhraseLabel4')}</li>
				</div>
				<div className="column">
					<li>{translate('popupPhraseLabel5')}</li>
				</div>
			</div>

			<div className="buttons">
				<Button text={translate('commonOkay')} onClick={() => props.close()} />
			</div>
		</>
	);

};

export default PopupPhrase;