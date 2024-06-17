import { I, Relation, UtilCommon, UtilObject, UtilFile, UtilSmile } from 'Lib';
import { commonStore } from 'Store';
const Colors = require('json/colors.json');
const Theme = require('json/theme.json');

class UtilGraph {

	imageSrc (d: any) {
		let src = '';

		switch (d.layout) {
			case I.ObjectLayout.Relation: {
				src = `img/icon/relation/big/${Relation.typeName(d.relationFormat)}.svg`;
				break;
			};

			case I.ObjectLayout.Task: {
				src = `img/icon/graph/task.svg`;
				break;
			};

			case I.ObjectLayout.Audio:
			case I.ObjectLayout.Video:
			case I.ObjectLayout.Pdf:
			case I.ObjectLayout.File: {
				src = UtilFile.iconPath(d);
				break;
			};

			case I.ObjectLayout.Image: {
				if (d.id) {
					src = commonStore.imageUrl(d.id, 100);
				} else {
					src = UtilFile.iconPath(d);
				};
				break;
			};
				
			case I.ObjectLayout.Human:
			case I.ObjectLayout.Participant: {
				if (d.iconImage) {
					src = commonStore.imageUrl(d.iconImage, 100);
				};
				break;
			};

			case I.ObjectLayout.Note: {
				break;
			};

			case I.ObjectLayout.Bookmark: {
				if (d.iconImage) {
					src = commonStore.imageUrl(d.iconImage, 100);
				};
				break;
			};
				
			default: {
				if (d.iconImage) {
					src = commonStore.imageUrl(d.iconImage, 100);
				} else
				if (d.iconEmoji) {
					const code = UtilSmile.getCode(d.iconEmoji);
					if (code) {
						src = UtilSmile.srcFromColons(code);
					};
					src = src.replace(/^.\//, '');
				} else
				if (d.iconOption) {
					src = this.gradientIcon(d.iconOption, true);
				};
				break;
			};
		};

		return src;
	};

	gradientIcon (iconOption: number, small?: boolean) {
		const option: any = Colors.gradientIcons.options[iconOption - 1];
		if (!option) {
			return;
		};

		const theme = commonStore.getThemeClass();
		const { from, to } = option.colors;
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		const w = 160;
		const r = w / 2;
		const fillW = small ? w * 0.7 : w;
		const fillR = fillW / 2;
		const steps = option.steps || Colors.gradientIcons.common.steps;
		const step0 = UtilCommon.getPercentage(fillR, steps.from * 100);
		const step1 = UtilCommon.getPercentage(fillR, steps.to * 100);
		const grd = ctx.createRadialGradient(r, r, step0, r, r, step1);

		canvas.width = w;
		canvas.height = w;
		grd.addColorStop(0, from);
		grd.addColorStop(1, to);

		if (small) {
			ctx.fillStyle = Theme[theme].graph.iconBg;
			ctx.fillRect(0, 0, w, w);
		};

		ctx.fillStyle = grd;
		ctx.beginPath();
		ctx.arc(r, r, fillR, 0, 2 * Math.PI);
		ctx.fill();

		return canvas.toDataURL();
	};

};

export default new UtilGraph();