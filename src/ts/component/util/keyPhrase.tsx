import * as React from 'react';
import { observer } from 'mobx-react';

const COLORS = [
	'orange',
	'turquoise',
	'green',
	'blue',
	'yellow',
	'lavender',
	'magenta',
];

type Props = {
	isBlurred: boolean,
	phrase: string
}

const KeyPhrase = observer(class Phrase extends React.Component<Props> {

	render () {
		const { phrase, isBlurred } = this.props;

		const cn = ['keyPhrase'];
		if (isBlurred) {
			cn.push('isBlurred');
		}

		return (
			<div
				className={cn.join(' ')}
				>
					{phrase.split(' ').map((word, index) => {

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