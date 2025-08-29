
import React, { forwardRef, useRef, useEffect, useState, memo, MouseEvent } from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Icon, Label, ProgressBar, Button } from 'Component';
import { I, S, U, translate, Renderer } from 'Lib';

interface Props extends I.SidebarPageComponent {
	id: string;
	name: string;
	style: any;
};

const SidebarPageVaultUpdate = observer(forwardRef<{}, Props>((props, ref) => {

	const { id, style } = props;
	const { updateVersion } = S.Common;
	const cn = [ 'item', 'isProgress' ];

	let info = null;
	let buttons = null;

	if (updateVersion) {
		cn.push('withButtons');

		info = (
			<div className="info">
				<div className="name">{translate('commonUpdateAvailable')}</div>
				<Label text={U.Common.sprintf(translate('commonNewVersion'), updateVersion)} />
			</div>
		);

		buttons = (
			<div className="buttons">
				<Button 
					color="blank"
					className="c28"
					text={translate('commonLater')} 
					onClick={() => {
						S.Common.updateVersionSet('');
						Renderer.send('updateCancel');
					}}
				/>
				<Button 
					color="blank"
					className="c28"
					text={translate('commonUpdateApp')}
					onClick={() => {
						Renderer.send('updateConfirm');
						S.Common.updateVersionSet('');
						U.Common.checkUpdateVersion(updateVersion);
					}}
				/>
			</div>
		);

	} else {
		const progress = S.Progress.getList(it => it.type == I.ProgressType.Update);
		const obj = progress.length ? progress[0] : null;
		const segments = [];

		if (!obj) {
			return null;
		};

		let percent = 0;
		if (progress.length) {
			segments.push({ name: '', caption: '', percent: obj.current / obj.total, isActive: true });

			percent = S.Progress.getPercent(progress);
		};

		info = (
			<div className="info">
				<div className="nameWrapper">
					<div className="name">{translate('progressUpdateDownloading')}</div>
					<div className="percent">{percent}%</div>
				</div>
				<ProgressBar segments={segments} />
			</div>
		);
	};

	return (
		<div 
			id={`item-${id}`}
			className="item isProgress"
			style={style}
		>
			<div className="infoWrapper">
				<Icon />
				{info}
			</div>
			{buttons}
		</div>
	);

}));

export default SidebarPageVaultUpdate;