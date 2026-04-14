import { forwardRef, useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { Button, Block, Loader, Icon, Select, IconObject, EmptySearch } from 'Component';
import * as I from 'Interface';
import * as M from 'Model';

const ROOT_ID = 'preview';

const Create = forwardRef<{}, I.PageComponent>((props, ref) => {

	const nodeRef = useRef<any>(null);
	const spaceRef = useRef<Select>(null);
	const [ isLoading, setIsLoading ] = useState(false);
	const [ object, setObject ] = useState<any>(null);
	const [ dummy, setDummy ] = useState(0);
	const { html } = S.Extension;
	const { space } = S.Common;
	const htmlRef = useRef('');
	const children = S.Block.getChildren(ROOT_ID, ROOT_ID, it => !it.isFile());

	const init = () => {
		const spaces = U.Space.getList()
			.sort(U.Data.sortByName)
			.filter(it => it && U.Space.canMyParticipantWrite(it.targetSpaceId))
			.map(it => ({ ...it, id: it.targetSpaceId, object: it, iconSize: 16 }));

		if (spaces.length) {
			const space = S.Common.space || spaces[0].targetSpaceId;

			spaceRef.current?.setOptions(spaces);
			spaceRef.current?.setValue(space);
			onSpaceChange(space);
		};
	};

	const initBlocks = () => {
		const { html, tabUrl } = S.Extension;

		if (html == htmlRef.current) {
			return;
		};

		htmlRef.current = html;
		S.Block.clear(ROOT_ID);

		if (!html) {
			setDummy(dummy + 1);
			return;
		};

		C.BlockPreview(html, tabUrl, (message: any) => {
			if (message.error.code) {
				return;
			};

			const structure: any[] = [];
			const blocks = message.blocks.map(it => new M.Block(it));

			blocks.forEach((block: any) => {
				structure.push({ id: block.id, childrenIds: block.childrenIds });
			});

			S.Block.set(ROOT_ID, blocks);
			S.Block.setStructure(ROOT_ID, structure);
			S.Block.updateStructureParents(ROOT_ID);
			S.Block.updateNumbers(ROOT_ID); 
			S.Block.updateMarkup(ROOT_ID);

			setDummy(dummy + 1);
		});
	};

	const onSelect = () => {
		const node = nodeRef.current;
		const filters: I.Filter[] = [
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.In, value: U.Object.getPageLayouts() },
			{ relationKey: 'type.uniqueKey', condition: I.FilterCondition.NotIn, value: [ J.Constant.typeKey.template ] }
		];

		S.Menu.open('searchObject', {
			element: node?.querySelector('#select-object'),
			data: {
				value: object ? [ object.id ] : [],
				canAdd: true,
				filters,
				details: { origin: I.ObjectOrigin.Webclipper },
				dataMapper: item => ({ ...item, iconSize: 16 }),
				onSelect: (item) => setObject(item),
			}
		});
	};

	const onSpaceChange = (id: string): void => {
		S.Common.spaceSet(id);
		U.Subscription.createAll();
	};

	const getWrapperWidth = () => {
		return window.innerWidth - 96;
	};

	const onSave = () => {
		const { html, tabUrl } = S.Extension;

		if (!object || !html) {
			return;
		};

		setIsLoading(true);

		C.BlockPaste(object.id, '', { from: 0, to: 0 }, [], false, { html }, tabUrl, () => {
			setIsLoading(false);
			onClose();
		});
	};

	const onClose = () => {
		htmlRef.current = '';
		parent.postMessage({ type: 'clickClose' }, '*');
	};

	useEffect(() => {
		U.Subscription.createAll(() => init());
	}, []);

	useEffect(() => {
		initBlocks();
	});

	return (
		<div ref={nodeRef} className="page pageCreate">
			{isLoading ? <Loader type={I.LoaderType.Loader} /> : ''}

			<div className="head">
				<div className="side left">
					<Select 
						id="select-space" 
						ref={spaceRef}
						value="" 
						options={[]}
						onChange={onSpaceChange}
						menuParam={{
							horizontal: I.MenuDirection.Center,
							data: { maxHeight: 360 }
						}}
					/>

					<div id="select-object" className="select" onMouseDown={onSelect}>
						<div className="item">
							{object ? <IconObject object={object} iconSize={16} /> : ''}
							<div className="name">{object ? object.name : translate('commonSelectObject')}</div>
						</div>
						<Icon className="arrow light" />
					</div>
				</div>
				<div className="side right">
					<Button text="Cancel" color="blank" size={32} onClick={onClose} />
					<Button text="Save" color="pink" size={32} onClick={onSave} />
				</div>
			</div>

			<div className="blocks">
				{!children.length ? <EmptySearch text={translate('webclipperEmptySelection')} /> : ''}

				{children.map((block: I.Block, i: number) => (
					<Block 
						key={block.id} 
						{...props}
						rootId={ROOT_ID}
						index={i}
						block={block}
						getWrapperWidth={() => getWrapperWidth()}
						readonly={true}
					/>
				))}
			</div>
		</div>
	);

});

export default Create;