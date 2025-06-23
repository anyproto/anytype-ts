import React, { forwardRef, useRef, useState, useEffect, useImperativeHandle } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Footer, Header, ListObjectManager, Icon, Title } from 'Component';
import { I, U, J, translate, Action, analytics } from 'Lib';

const PageMainArchive = observer(forwardRef<I.PageRef, I.PageComponent>((props, ref) => {

	const { isPopup } = props;
	const nodeRef = useRef(null);
	const managerRef = useRef(null);
	const [ rowLength, setRowLength ] = useState(0);

	const onRestore = () => {
		Action.restore(managerRef.current?.getSelected(), analytics.route.archive);
		selectionClear();
	};

	const onRemove = () => {
		Action.delete(managerRef.current?.getSelected(), 'Bin', () => selectionClear());
	};

	const selectionClear = () => {
		managerRef.current?.selectionClear();
	};

	const getRowLength = () => {
		return U.Common.getWindowDimensions().ww <= 940 ? 2 : 3;
	};

	const resize = () => {
		const win = $(window);
		const container = U.Common.getPageFlexContainer(isPopup);
		const node = $(nodeRef.current);
		const wh = isPopup ? container.height() : win.height();
		const rl = getRowLength();

		node.css({ height: wh - J.Size.header });

		if (rowLength != rl) {
			setRowLength(rl);
		};
	};

	const filters: I.Filter[] = [
		{ relationKey: 'isArchived', condition: I.FilterCondition.Equal, value: true },
	];
	const sorts: I.Sort[] = [
		{ relationKey: 'lastModifiedDate', type: I.SortType.Desc },
	];

	const buttons: I.ButtonComponent[] = [
		{ icon: 'restore', text: translate('commonRestore'), onClick: onRestore },
		{ icon: 'remove', text: translate('commonDeleteImmediately'), onClick: onRemove }
	];

	useEffect(() => {
		analytics.event('ScreenBin');
	}, []);

	useImperativeHandle(ref, () => ({
		resize,
	}));

	return (
		<>
			<Header {...props} component="mainEmpty" />

			<div ref={nodeRef} className="wrapper">
				<div className="titleWrapper">
					<Icon className="archive" />
					<Title text={translate('commonBin')} />
				</div>

				<ListObjectManager
					isPopup={isPopup}
					ref={managerRef}
					subId={J.Constant.subId.archive}
					filters={filters}
					sorts={sorts}
					rowLength={getRowLength()}
					ignoreArchived={false}
					buttons={buttons}
					iconSize={48}
					resize={resize}
					textEmpty={translate('pageMainArchiveEmpty')}
					isReadonly={!U.Space.canMyParticipantWrite()}
				/>
			</div>

			<Footer {...props} component="mainObject" />
		</>
	);

}));

export default PageMainArchive;
