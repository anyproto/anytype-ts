import { I, S, U, J, Relation } from 'Lib';

class UtilGraph {

	imageSrc (d: any) {
		let src = '';

		switch (d.layout) {
			case I.ObjectLayout.Relation: {
				src = `img/icon/relation/${Relation.typeName(d.relationFormat)}.svg`;
				break;
			};

			case I.ObjectLayout.Task: {
				src = `img/icon/graph/task${Number(d.done) || 0}.svg`;
				break;
			};

			case I.ObjectLayout.Date: {
				src = `img/icon/relation/date.svg`;
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
				};
				break;
			};
		};

		return src;
	};

};

export default new UtilGraph();