import { I } from "Lib";

export interface Preview {
	type: I.MarkType.Link | I.MarkType.Object,
    /** object ID or URL */
	target: string;
	element: JQuery<HTMLElement>;
	range: I.TextRange;
	marks: I.Mark[];
	noUnlink?: boolean;
	onChange?(marks: I.Mark[]): void;
};