import * as React from 'react';
import { I, Util, focus } from 'ts/lib';
import { observer } from 'mobx-react';

interface Props {
	rootId: string;
	block: I.Block;
	onKeyDown?(e: any, text?: string, marks?: I.Mark[]): void;
	onKeyUp?(e: any, text?: string, marks?: I.Mark[]): void;
};

@observer
class BlockDiv extends React.Component<Props, {}> {

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
		
		let cn = [ 'div', 'focusable', 'c' + id ];
		let inner: any = null;
			
		switch (content.style) {
			case I.DivStyle.Dot:
				inner = (
					<React.Fragment>
						<div className="dot" />
						<div className="dot" />
						<div className="dot" />
					</React.Fragment>
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
		this.props.onKeyDown(e, '', []);
	};
	
	onKeyUp (e: any) {
		this.props.onKeyUp(e, '', []);
	};

	onFocus () {
		const { block } = this.props;
		focus.set(block.id, { from: 0, to: 0 });
	};
	
};

export default BlockDiv;