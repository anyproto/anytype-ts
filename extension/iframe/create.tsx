import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Button, Block, Loader, Icon, Select, IconObject, EmptySearch } from 'Component';
import { I, C, M, translate, UtilObject, UtilData } from 'Lib';
import { blockStore, extensionStore, menuStore, dbStore, commonStore } from 'Store';

interface State {
	isLoading: boolean;
	error: string;
	object: any;
};

const ROOT_ID = 'preview';

const Create = observer(class Create extends React.Component<I.PageComponent, State> {

	state: State = {
		isLoading: false,
		error: '',
		object: null,
	};
	node: any = null;
	refSpace: any = null;
	html = '';

	constructor (props: I.PageComponent) {
		super(props);

		this.onSave = this.onSave.bind(this);
		this.onClose = this.onClose.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.onSpaceChange = this.onSpaceChange.bind(this);	
	};

	render () {
		const { isLoading, error, object } = this.state;
		const { html } = extensionStore;
		const { space } = commonStore;
		const children = blockStore.getChildren(ROOT_ID, ROOT_ID, it => !it.isFile());

		return (
			<div ref={ref => this.node = ref} className="page pageCreate">
				{isLoading ? <Loader type="loader" /> : ''}

				<div className="head">
					<div className="side left">
						<Select 
							id="select-space" 
							ref={ref => this.refSpace = ref}
							value="" 
							options={[]}
							onChange={this.onSpaceChange}
							menuParam={{
								horizontal: I.MenuDirection.Center,
								data: { maxHeight: 360 }
							}}
						/>

						<div id="select" className="select" onMouseDown={this.onSelect}>
							<div className="item">
								{object ? <IconObject object={object} iconSize={16} /> : ''}
								<div className="name">{object ? object.name : translate('commonSelectObject')}</div>
							</div>
							<Icon className="arrow light" />
						</div>
					</div>
					<div className="side right">
						<Button text="Cancel" color="blank" className="c32" onClick={this.onClose} />
						<Button text="Save" color="pink" className="c32" onClick={this.onSave} />
					</div>
				</div>

				<div className="blocks">
					{!children.length ? <EmptySearch text={translate('webclipperEmptySelection')} /> : ''}

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

	componentDidMount (): void {
		UtilData.createSubscriptions(() => {
			this.init();
		});
	};

	componentDidUpdate (): void {
		this.initBlocks();
	};

	init () {
		const spaces = dbStore.getSpaces().map(it => ({ ...it, id: it.targetSpaceId, object: it, iconSize: 16 })).filter(it => it);

		if (this.refSpace && spaces.length) {
			const space = commonStore.space || spaces[0].targetSpaceId;

			this.refSpace?.setOptions(spaces);
			this.refSpace?.setValue(space);
			this.onSpaceChange(space);
		};
	};

	initBlocks () {
		const { html, tabUrl } = extensionStore;

		if (!html || (html == this.html)) {
			return;
		};

		this.html = html;

		C.BlockPreview(html, tabUrl, (message: any) => {
			if (message.error.code) {
				return;
			};

			const structure: any[] = [];
			const blocks = message.blocks.map(it => new M.Block(it));

			blocks.forEach((block: any) => {
				structure.push({ id: block.id, childrenIds: block.childrenIds });
			});

			blockStore.set(ROOT_ID, blocks);
			blockStore.setStructure(ROOT_ID, structure);

			this.forceUpdate();
		});
	};

	onSelect () {
		const { object } = this.state;
		const node = $(this.node);
		const templateType = dbStore.getTemplateType();
		const filters: I.Filter[] = [
			{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.In, value: UtilObject.getPageLayouts() },
			{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.NotEqual, value: templateType?.id },
		];

		menuStore.open('searchObject', {
			element: node.find('#select'),
			data: {
				value: object ? [ object.id ] : [],
				canAdd: true,
				filters,
				details: { origin: I.ObjectOrigin.Webclipper },
				dataMapper: item => ({ ...item, iconSize: 16 }),
				onSelect: (item) => {
					this.setState({ object: item });
				},
			}
		});
	};

	onSpaceChange (id: string): void {
		commonStore.spaceSet(id);
		UtilData.createSubscriptions();
	};

	getWrapperWidth () {
		const win: any = $(window);
		return win.width() - 96;
	};

	onSave () {
		const { html, tabUrl } = extensionStore;
		const { object } = this.state;

		if (!object) {
			return;
		};

		C.BlockPaste(object.id, '', { from: 0, to: 0 }, [], false, { html }, tabUrl, () => {
			this.onClose();
		});
	};

	onClose () {
		this.html = '';
		parent.postMessage({ type: 'clickClose' }, '*');
	};

});

export default Create;