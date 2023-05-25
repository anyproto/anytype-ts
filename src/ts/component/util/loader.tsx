import * as React from 'react';

interface Props {
	id?: string;
	type?: string;
	className?: string;
};

class Loader extends React.Component<Props> {

	public static defaultProps = {
		className: '',
		type: 'dots',
	};

	render () {
		const { id, type, className } = this.props;

		let content = null;
		switch (type) {
			case 'loader': {
				content = <div className="loader" />;
				break;
			};

			case 'dots': {
				content = (
					<div className="dots">
						<div className="dot" />
						<div className="dot" />
						<div className="dot" />
					</div>
				);
				break;
			};
		};

		return (
			<div id={id} className={[ 'loaderWrapper', className ].join(' ')}>
				{content}
			</div>
		);
	};
	
};

export default Loader;