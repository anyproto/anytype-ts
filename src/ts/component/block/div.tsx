import * as React from 'react';
import { I, focus } from 'ts/lib';
import { observer } from 'mobx-react';

interface Props extends I.BlockComponent {}

const BlockDiv = observer(class BlockDiv extends React.Component<Props, {}> {

	_isMounted: boolean = false;

	constructor (props: any) {
		super(props);
		
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onFocus = this.onFocus.bind(this);
	};

	render () {
		const { rootId, block } = this.props;
		const { id, content } = block;
		const { style } = content;
		
		let cn = [ 'wrap', 'focusable', 'c' + id ];
		let inner: any = null;
			
		switch (content.style) {
			case I.DivStyle.Line:
				inner = (
					<div className="line" />
				);
				break;

			case I.DivStyle.Dot:
				inner = (
					<div className="dots">
						<div className="dot" />
						<div className="dot" />
						<div className="dot" />
					</div>
				);
				break;
		};

		return (
			<div className={cn.join(' ')} tabIndex={0} onKeyDown={this.onKeyDown} onKeyUp={this.onKeyUp} onFocus={this.onFocus}>
				{inner}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};
	
	onKeyDown (e: any) {
		const { onKeyDown } = this.props;

		if (onKeyDown) {
			onKeyDown(e, '', [], { from: 0, to: 0 }, this.props);
		};
	};
	
	onKeyUp (e: any) {
		const { onKeyUp } = this.props;

		if (onKeyUp) {
			onKeyUp(e, '', [], { from: 0, to: 0 });
		};
	};

	onFocus () {
		const { block } = this.props;
		focus.set(block.id, { from: 0, to: 0 });
	};
	
});

export default BlockDiv;