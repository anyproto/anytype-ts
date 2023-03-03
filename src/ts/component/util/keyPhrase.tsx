import * as React from 'react';
import { observer } from 'mobx-react';
import { Util, Preview } from 'Lib';
import { authStore } from 'Store';

const COLORS = [
	"orange",
	"turquoise",
	"green",
	"blue",
	"yellow",
	"lavender",
	"magenta",
];

type Props = {
	isBlurred: boolean 
}

const KeyPhrase = observer(class KeyPhrase extends React.Component<Props> {
	render () {
		return (
			<div
				className={"keyPhrase " + (this.props.isBlurred ? "isBlurred" : "")}
				onClick={this.onClick}
				>
					{authStore.phrase.split(' ').map((word, index) => {
						// rotate through the colors
						const color = COLORS[index % COLORS.length];
						// capitalize each word
						word = word.charAt(0).toUpperCase() + word.slice(1);
						return <span className={color} key={index}>{word}</span>
					})}
			</div>
		);
	};
	onClick = () => {
		Util.clipboardCopy({ text: authStore.phrase });
		Preview.toastShow({ text: 'Recovery phrase copied to clipboard' });
	}
});

export default KeyPhrase;