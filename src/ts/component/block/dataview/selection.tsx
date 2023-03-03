import * as React from 'react';
import { observer } from 'mobx-react';
import $ from 'jquery';
import { I, Util, analytics } from 'Lib';

const Selection = observer(class Selection extends React.Component<I.ViewComponent> {

	_isMounted = false;
	node: any = null;

	constructor (props: I.ViewComponent) {
		super(props);

		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { isInline, isCollection, dataset } = this.props;
		const { selection } = dataset;
		const cn = [ 'dataviewControls', 'dataviewSelection' ];
		const ids = selection ? selection.get(I.SelectType.Record) : [];

		if (isInline) {
			cn.push('isInline');
		};

		const buttons = [
			{ id: 'delete', text: 'Move to bin' },
			{ id: 'done', text: 'Done', className: [ 'orange' ] },
		];

		if (isCollection) {
			buttons.unshift({ id: 'unlink', text: 'Unlink' });
		};

		return (
			<div
				ref={node => this.node = node}
				className={cn.join(' ')}
			>
				<div className="sides">
					<div id="sideLeft" className="side left">{ids.length} selected</div>

					<div id="sideRight" className="side right">
						{buttons.map((item: any, i: number) => (
							<div
								key={i}
								className={[ 'element' ].concat(item.className || []).join(' ')}
								onClick={(e: any) => { this.onClick(e, item.id) }}
							>
								{item.text}
							</div>
						))}
					</div>
				</div>

				<div className="line" />
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	onClick (e: any, id: string) {
		e.preventDefault();

		console.log(id)
	};

	resize () {
		if (!this._isMounted) {
			return;
		};

		const { isPopup, isInline } = this.props;
		const node = $(this.node);
		const sideLeft = node.find('#sideLeft');
		const sideRight = node.find('#sideRight');
		const container = Util.getPageContainer(isPopup);
		const { left } = sideLeft.offset();
		const sidebar = $('#sidebar');

		sideLeft.removeClass('small');

		let width = sideLeft.outerWidth() + sideRight.outerWidth();
		let offset = 0;
		let sw = sidebar.outerWidth();

		if (isPopup) {
			offset = container.offset().left;
		};

		if (left + width - offset - sw >= container.width()) {
			sideLeft.addClass('small');
		};

		if (isInline && (width >= node.outerWidth())) {
			sideLeft.addClass('small');
		};
	};

});

export default Selection;