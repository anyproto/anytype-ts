import * as React from 'react';
import { observer } from 'mobx-react';
import { Textarea } from 'Component';
import { I, translate, Util, Preview } from 'Lib';
import { authStore } from 'Store';

const KeyPhrase = observer(class KeyPhrase extends React.Component {
	refPhrase = null;

	constructor (props: I.PageComponent) {
		super(props);

		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onCopy = this.onCopy.bind(this);
	};

	render () {
		return (
			<div className="textareaWrap">
				<Textarea 
					ref={ref => this.refPhrase = ref} 
					id="phrase" 
					className=""
					value={translate('popupSettingsPhraseStub')} 
					placeholder="witch collapse practice feed shame open despair creek road again ice least lake tree young address brain envelope" 
					readonly={true}
					onFocus={this.onFocus} 
					onBlur={this.onBlur} 
					onCopy={this.onCopy}
				/>
			</div>
		);
	};

	onFocus () {
		this.refPhrase.setValue(authStore.phrase);
		this.refPhrase.select();
		this.refPhrase.removeClass('isBlurred');
	};

	onBlur () {
		this.refPhrase.setValue(translate('popupSettingsPhraseStub'));
		this.refPhrase.addClass('isBlurred');
		window.getSelection().removeAllRanges();
	};

	onCopy () {
		this.refPhrase.focus();
		Util.clipboardCopy({ text: authStore.phrase });
		Preview.toastShow({ text: 'Recovery phrase copied to clipboard' });
	};
});

export default KeyPhrase;