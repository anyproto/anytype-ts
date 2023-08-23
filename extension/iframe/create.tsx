import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Button, Block, Loader } from 'Component';
import { I, C, UtilData } from 'Lib';
import { blockStore } from 'Store';

interface State {
	isLoading: boolean;
	error: string;
};

const ROOT_ID = 'bafyreid4jqmmox4monwirlsmgnobducuw57bvgxqzoguzs2acigiam6vym';

const Create = observer(class Create extends React.Component<I.PageComponent, State> {

	state = {
		isLoading: false,
		error: '',
	};

	constructor (props: I.PageComponent) {
		super(props);

		this.onClose = this.onClose.bind(this);
	};

	render () {
		const { isLoading, error } = this.state;
		const rootId = ROOT_ID;
		const childrenIds = blockStore.getChildrenIds(rootId, rootId);
		const children = blockStore.getChildren(rootId, rootId);

		return (
			<div className="page pageIndex">
				{isLoading ? <Loader type="loader" /> : ''}

				<div className="head">
					<div className="side left">
					</div>
					<div className="side right">
						<Button text="Save" color="orange" className="c32" />
						<Button text="Clear" color="simple" className="c32" />
						<Button text="Cancel" color="simple" className="c32" onClick={this.onClose} />
					</div>
				</div>
				<div className="blocks">
					{children.map((block: I.Block, i: number) => (
						<Block 
							key={block.id} 
							{...this.props}
							rootId={rootId}
							index={i}
							block={block}
							getWrapperWidth={() => this.getWrapperWidth()}
							readonly={true}
						/>
					))}
				</div>
			</div>
		);
	};

	componentDidMount(): void {
		this.load();
	};

	load () {
		this.setState({ isLoading: true });

		UtilData.createsSubscriptions(() => {
			C.ObjectOpen(ROOT_ID, '', (message: any) => {
				if (message.error.code) {
					return;
				};

				this.setState({ isLoading: false });
			});
		});
	};

	getWrapperWidth () {
		const win: any = $(window);
		return win.width() - 96;
	};

	onClose () {
		parent.postMessage({ type: 'clickClose' }, '*');
	};

});

export default Create;