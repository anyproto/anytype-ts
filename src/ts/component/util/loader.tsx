import * as React from 'react';

interface Props {
	className?: string;
};

class Loader extends React.Component<Props, {}> {

	public static defaultProps = {
		className: '',
	};

	render () {
		const { className } = this.props;

		return (
			<div className={[ 'loaderWrapper', className ].join(' ')}>
				<div className="loader" />
			</div>
		);
	};
	
};

export default Loader;