import * as React from 'react';

interface Props {
	id?: string;
	className?: string;
};

class Loader extends React.Component<Props, {}> {

	public static defaultProps = {
		className: '',
	};

	render () {
		const { id, className } = this.props;

		return (
			<div id={id} className={[ 'loaderWrapper', className ].join(' ')}>
				<div className="loader" />
			</div>
		);
	};
	
};

export default Loader;