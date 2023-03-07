import * as React from 'react';
import { observer } from 'mobx-react';
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
});

export default KeyPhrase;