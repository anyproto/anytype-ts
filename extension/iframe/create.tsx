import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Button, Block, Loader } from 'Component';
import { I, C, M } from 'Lib';
import { blockStore, extensionStore } from 'Store';

interface State {
	isLoading: boolean;
	error: string;
};

const ROOT_ID = 'preview';

const Create = observer(class Create extends React.Component<I.PageComponent, State> {

	state = {
		isLoading: false,
		error: '',
	};
	html = '';

	constructor (props: I.PageComponent) {
		super(props);

		this.onClose = this.onClose.bind(this);
	};

	render () {
		const { isLoading, error } = this.state;
		const { html } = extensionStore;
		const childrenIds = blockStore.getChildrenIds(ROOT_ID, ROOT_ID);
		const children = blockStore.getChildren(ROOT_ID, ROOT_ID);
		const length = children.length;

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
							rootId={ROOT_ID}
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

	componentDidUpdate (): void {
		this.init();
	};

	init () {
		const { html } = extensionStore;

		if (!html || (html == this.html)) {
			return;
		};

		this.html = html;

		C.BlockPreview(html, (message: any) => {
			if (message.error.code) {
				return;
			};

			const structure: any[] = [];
			const blocks = message.blocks.map(it => new M.Block(it));

			blocks.unshift(new M.Block({
				id: ROOT_ID,
				type: I.BlockType.Page,
				childrenIds: message.blocks.map(it => it.id),
				content: {},
			}));

			blocks.forEach((block: any) => {
				structure.push({ id: block.id, childrenIds: block.childrenIds });
			});

			blockStore.set(ROOT_ID, blocks);
			blockStore.setStructure(ROOT_ID, structure);

			this.forceUpdate();
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