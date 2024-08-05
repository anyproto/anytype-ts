import { I, S, U, J, Relation } from 'Lib';

class UtilGraph {

	imageSrc (d: any) {
		let src = '';

		switch (d.layout) {
			case I.ObjectLayout.Relation: {
				src = `img/icon/relation/big/${Relation.typeName(d.relationFormat)}.svg`;
				break;
			};

			case I.ObjectLayout.Task: {
				src = `img/icon/graph/task${Number(d.done) || 0}.svg`;
				break;
			};

			case I.ObjectLayout.Audio:
			case I.ObjectLayout.Video:
			case I.ObjectLayout.Pdf:
			case I.ObjectLayout.File: {
				src = U.File.iconPath(d);
				break;
			};

			case I.ObjectLayout.Image: {
				if (d.id) {
					src = S.Common.imageUrl(d.id, 100);
				} else {
					src = U.File.iconPath(d);
				};
				break;
			};
				
			case I.ObjectLayout.Human:
			case I.ObjectLayout.Participant: {
				if (d.iconImage) {
					src = S.Common.imageUrl(d.iconImage, 100);
				};
				break;
			};

			case I.ObjectLayout.Note: {
				break;
			};

			case I.ObjectLayout.Bookmark: {
				if (d.iconImage) {
					src = S.Common.imageUrl(d.iconImage, 100);
				};
				break;
			};
				
			default: {
				if (d.iconImage) {
					src = S.Common.imageUrl(d.iconImage, 100);
				} else
				if (d.iconEmoji) {
					const code = U.Smile.getCode(d.iconEmoji);
					if (code) {
						src = U.Smile.srcFromColons(code);
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
		const option: any = J.Color.icons.colors[iconOption - 1];
		if (!option) {
			return;
		};

		const theme = S.Common.getThemeClass();
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		const w = 160;
		const r = w / 2;
		const fillW = small ? w * 0.7 : w;
		const fillR = fillW / 2;
		const { from, to } = J.Color.icons.steps;
		const step0 = U.Common.getPercentage(fillR, from * 100);
		const step1 = U.Common.getPercentage(fillR, to * 100);
		const grd = ctx.createRadialGradient(r, r, step0, r, r, step1);

		canvas.width = w;
		canvas.height = w;
		grd.addColorStop(0, option.from);
		grd.addColorStop(1, option.to);

		if (small) {
			ctx.fillStyle = J.Theme[theme].graph.iconBg;
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