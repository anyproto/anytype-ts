import * as React from 'react';
import { Icon, Label, Button } from 'Component';
import { Util } from 'Lib';

interface Props {
	className?: string;
};

class Deleted extends React.Component<Props, {}> {

	public static defaultProps = {
		className: '',
	};

	render () {
		const { className } = this.props;

		return (
			<div id="deleteWrapper" className={[ 'deleteWrapper', className ].join(' ')}>
				<div className="mid">
					<Icon className="ghost" />
					<Label text="This object doesn't exist" />
					<Button color="blank" text="Back to dashboard" onClick={() => { Util.route('/main/index'); }} />
				</div>
			</div>
		);
	};
	
};

export default Deleted;