import * as React from 'react';
import { Title, Label, Button, IconObject } from 'Component';
import { I, translate } from 'Lib';

class PopupPhrase extends React.Component<I.Popup> {
	
	render () {
		return (
			<div>
				<Title text="What is Recovery Phrase?" />
				<div className="rows">
					<div className="row">
						<IconObject size={40} iconSize={40} object={{ iconEmoji: ':game_die:' }} />
						<Label text="Recovery Phrase is 12 random words from which your account is magically generated on this device." />
					</div>
					<div className="row">
						<IconObject size={40} iconSize={40} object={{ iconEmoji: ':point_up:' }} />
						<Label text="Who knows combination of these words – owns the account. Now, you are the only person in the world who can access it." />
					</div>
					<div className="row">
						<IconObject size={40} iconSize={40} object={{ iconEmoji: ':point_up:' }} />
						<Label text="That is why it is essential to keep Recovery Phrase secure! You own - you responsible! " />
					</div>
				</div>

				<Title text="How to save my phrase?" />
				<div className="columns">
					<div className="column">
						<li>The easiest way to store your Recovery Phrase is to save it in your password manager.</li>
					</div>
					<div className="column">
						<li>The most secure way is to write it down on paper and keep it offline, in a safe and secure place.</li>
					</div>
				</div>

				<div className="buttons">
					<Button text={translate('commonOkay')} onClick={() => this.props.close()} />
				</div>
			</div>
		);
	};

};

export default PopupPhrase;