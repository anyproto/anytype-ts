import * as React from 'react';
import { Icon, Label, Button } from 'Component';
import { Util } from 'Lib';
import { popupStore } from 'Store';

interface Props {
	className?: string;
	isPopup?: boolean;
};

class Deleted extends React.Component<Props, {}> {

	public static defaultProps = {
		className: '',
	};

	render () {
		const { className, isPopup } = this.props;

		let onClick = null;
		let textButton = '';

		if (isPopup) {
			textButton = 'Close';
			onClick = () => { popupStore.close('page'); };
		} else {
			textButton = 'Back to dashboard';
			onClick = () => { Util.route('/main/index'); };
		};

		return (
			<div id="deleteWrapper" className={[ 'deleteWrapper', className ].join(' ')}>
				<div className="mid">
					<Icon className="ghost" />
					<Label text="This object doesn't exist" />
					<Button color="blank" text={textButton} onClick={onClick} />
				</div>
			</div>
		);
	};
	
};

export default Deleted;