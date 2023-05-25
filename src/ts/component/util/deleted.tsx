import * as React from 'react';
import $ from 'jquery';
import { Icon, Label, Button } from 'Component';
import { ObjectUtil, Util } from 'Lib';
import { popupStore } from 'Store';

interface Props {
	className?: string;
	isPopup?: boolean;
};

class Deleted extends React.Component<Props> {

	public static defaultProps = {
		className: '',
	};
	node = null;

	render () {
		const { className, isPopup } = this.props;

		let onClick = null;
		let textButton = '';

		if (isPopup) {
			textButton = 'Close';
			onClick = () => popupStore.close('page');
		} else {
			textButton = 'Back to dashboard';
			onClick = () => ObjectUtil.openHome('route');
		};

		return (
			<div 
				ref={ref => this.node = ref}
				id="deleteWrapper" 
				className={[ 'deleteWrapper', className ].join(' ')}
			>
				<div className="mid">
					<Icon className="ghost" />
					<Label text="This object doesn't exist" />
					<Button color="blank" text={textButton} onClick={onClick} />
				</div>
			</div>
		);
	};

	componentDidMount (): void {
		this.resize();
		$(window).on('resize.deleted', () => this.resize());
	};

	componentWillUnmount (): void {
		$(window).off('resize.deleted');
	};

	resize () {
		const { isPopup } = this.props;
		const node = $(this.node);
		const container = isPopup ? $('#popupPage-innerWrap') : $(window);

		node.css({ height: container.height() });
	};
	
};

export default Deleted;