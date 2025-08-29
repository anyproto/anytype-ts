
import React, { forwardRef, useRef, useEffect, useState, memo, MouseEvent } from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Icon, Label, ProgressBar } from 'Component';
import { I, S, U, translate } from 'Lib';

interface Props extends I.SidebarPageComponent {
	id: string;
	name: string;
	style: any;
};

const SidebarPageVaultUpdate = observer(forwardRef<{}, Props>((props, ref) => {

	const { id, name, style } = props;
	const progress = S.Progress.getList(it => it.type == I.ProgressType.Update);
	const segments = [];
	const obj = progress.length ? progress[0] : null;

	if (!obj) {
		return null;
	};

	let percent = 0;
	if (progress.length) {
		segments.push({ name: '', caption: '', percent: obj.current / obj.total, isActive: true });

		percent = S.Progress.getPercent(progress);
	};

	return (
		<div 
			id={`item-${id}`}
			className="item isProgress"
			style={style}
		>
			<Icon />
			<div className="info">
				<div className="nameWrapper">
					<div className="name">{name}</div>
					<div className="percent">{percent}%</div>
				</div>
				<ProgressBar segments={segments} />
			</div>
		</div>
	);

}));

export default SidebarPageVaultUpdate;