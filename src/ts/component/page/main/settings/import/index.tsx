import React, { forwardRef, useState } from 'react';
import { Icon, IconObject, Title, Label, ObjectName, Error } from 'Component';
import * as I from 'Interface';
import AiSettings from './aiSettings';

const ADD_ID = 'add';

interface Props extends I.PageSettingsComponent {
	onImport: (type: I.ImportType, param: any) => void;
};

const PageMainSettingsImportIndex = forwardRef<I.PageRef, Props>((props, ref) => {

	const { onPage } = props;
	const [ error, setError ] = useState('');
	const items = U.Menu.getImportFormats();
	const apps = items.filter(it => it.isApp);
	const others = items.filter(it => !it.isApp);
	const targetId = U.Space.getImportTargetId();
	const target = U.Space.getSpaceviewBySpaceId(targetId) || U.Space.getSpaceview();

	const onClick = (id: string) => {
		const item = items.find(it => it.id == id);
		const common = [ I.ImportType.Html, I.ImportType.Text, I.ImportType.Protobuf, I.ImportType.Markdown ];

		if (common.includes(item.format)) {
			Action.import(targetId, item.format, J.Constant.fileExtension.import[item.format], {}, (message: any) => {
				if (message.error.code) {
					setError(message.error.description);
				} else {
					U.Space.openImportTarget(targetId);
				};
			});
		} else {
			onPage(U.String.toCamelCase(`import-${item.id}`));
		};
	};

	const onTarget = () => {
		const options: any[] = U.Space.getImportTargetList().map(it => ({
			...it,
			id: it.targetSpaceId,
			object: it,
		}));

		options.push({ isDiv: true });
		options.push({ id: ADD_ID, iconParam: { name: 'menu/action/add' }, name: translate('commonNewChannel') });

		S.Menu.open('select', {
			element: '#importTarget',
			offsetY: 2,
			noFlipX: true,
			data: {
				options,
				value: targetId,
				noVirtualisation: true,
				onSelect: (e: any, item: any) => {
					if (item.id != ADD_ID) {
						S.Common.importSpaceIdSet(item.id);
						return;
					};

					// Created for this screen only: the popup skips the home step and hands the
					// new id back here, so the user stays on Import instead of being moved.
					U.Menu.spaceCreate({ element: '#importTarget' }, analytics.route.settings, {
						intent: I.SpaceCreateIntent.Import,
						noJoin: true,
						onCreate: (spaceId: string) => S.Common.importSpaceIdSet(spaceId),
					});
				},
			},
		});
	};

	const Item = (item: any) => {
		const cn = [ 'item', item.id ];

		if (item.isApp) {
			cn.push('isApp');
		};

		return (
			<div className={cn.join(' ')} onClick={() => onClick(item.id)} >
				<Icon name={`import/${item.id}`} size={item.isApp ? 18 : 40} />
				<div className="name">{item.name}</div>
			</div>
		);
	};

	return (
		<>
			<Title text={translate('popupSettingsImportTitle')} />

			<div className="sections">
				<div className="actionItems target">
					<div className="item">
						<Label text={translate('popupSettingsImportTarget')} />

						<div id="importTarget" className="select" onClick={onTarget}>
							<div className="currentSelected">
								<IconObject object={target} size={20} />
								<ObjectName object={target} />
							</div>
							<Icon name="arrow/select" className="arrow light" />
						</div>
					</div>
				</div>

				<div className="section app">
					<Title className="sub" text={translate('popupSettingsImportByApp')} />
					<div className="items">
						{apps.map((item: any, i: number) => (
							<Item key={i} {...item} />
						))}
					</div>
				</div>

				<div className="section">
					<Title className="sub" text={translate('popupSettingsImportByFormat')} />
					<div className="items">
						{others.map((item: any, i: number) => (
							<Item key={i} {...item} />
						))}
					</div>
				</div>

				<AiSettings />

				<Error text={error} />
			</div>
		</>
	);

});

export default PageMainSettingsImportIndex;
