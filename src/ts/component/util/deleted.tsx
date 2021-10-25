import * as React from 'react';
import { Icon, Label, Button } from 'ts/component';

interface Props {
	history: any;
	className?: string;
};

class Deleted extends React.Component<Props, {}> {

	public static defaultProps = {
		className: '',
	};

	render () {
		const { history, className } = this.props;

		return (
			<div className={[ 'deleteWrapper', className ].join(' ')}>
				<div className="mid">
					<Icon className="ghost" />
					<Label text="This object doesn't exist" />
					<Button color="blank" text="Back to dashboard" onClick={() => { history.push('/main/index'); }} />
				</div>
			</div>
		);
	};
	
};

export default Deleted;