import { describe, it, expect } from 'vitest';
import UtilObject from './object';

// Enum values matching src/ts/interface/object.ts
const L = {
	Page: 0, Human: 1, Task: 2, Set: 3, Type: 4, Relation: 5, File: 6,
	Dashboard: 7, Image: 8, Note: 9, Space: 10, Bookmark: 11, OptionList: 12,
	Option: 13, Collection: 14, Audio: 15, Video: 16, Date: 17, SpaceView: 18,
	Participant: 19, Pdf: 20, ChatOld: 21, Chat: 22, Discussion: 27,
	Navigation: 101, Graph: 102, History: 103, Archive: 104, Block: 105, Settings: 106,
};

describe('UtilObject', () => {

	describe('actionByLayout', () => {
		it('should return "edit" for Page layout', () => {
			expect(UtilObject.actionByLayout(L.Page)).toBe('edit');
		});

		it('should return "edit" for Note layout', () => {
			expect(UtilObject.actionByLayout(L.Note)).toBe('edit');
		});

		it('should return "media" for file layouts', () => {
			expect(UtilObject.actionByLayout(L.File)).toBe('media');
			expect(UtilObject.actionByLayout(L.Image)).toBe('media');
			expect(UtilObject.actionByLayout(L.Video)).toBe('media');
			expect(UtilObject.actionByLayout(L.Audio)).toBe('media');
			expect(UtilObject.actionByLayout(L.Pdf)).toBe('media');
		});

		it('should return "set" for set layouts', () => {
			expect(UtilObject.actionByLayout(L.Set)).toBe('set');
			expect(UtilObject.actionByLayout(L.Collection)).toBe('set');
			expect(UtilObject.actionByLayout(L.Type)).toBe('set');
		});

		it('should return "chat" for chat layouts', () => {
			expect(UtilObject.actionByLayout(L.Chat)).toBe('chat');
			expect(UtilObject.actionByLayout(L.ChatOld)).toBe('chat');
			expect(UtilObject.actionByLayout(L.Discussion)).toBe('chat');
			expect(UtilObject.actionByLayout(L.Space)).toBe('chat');
		});

		it('should return "relation" for Relation layout', () => {
			expect(UtilObject.actionByLayout(L.Relation)).toBe('relation');
		});

		it('should return "date" for Date layout', () => {
			expect(UtilObject.actionByLayout(L.Date)).toBe('date');
		});

		it('should return "graph" for Graph layout', () => {
			expect(UtilObject.actionByLayout(L.Graph)).toBe('graph');
		});

		it('should return "history" for History layout', () => {
			expect(UtilObject.actionByLayout(L.History)).toBe('history');
		});

		it('should return "archive" for Archive layout', () => {
			expect(UtilObject.actionByLayout(L.Archive)).toBe('archive');
		});

		it('should return "navigation" for Navigation layout', () => {
			expect(UtilObject.actionByLayout(L.Navigation)).toBe('navigation');
		});

		it('should return "settings" for Settings layout', () => {
			expect(UtilObject.actionByLayout(L.Settings)).toBe('settings');
		});

		it('should return "block" for Block layout', () => {
			expect(UtilObject.actionByLayout(L.Block)).toBe('block');
		});

		it('should default to "edit" for null/undefined', () => {
			expect(UtilObject.actionByLayout(null as any)).toBe('edit');
			expect(UtilObject.actionByLayout(undefined as any)).toBe('edit');
		});
	});

	describe('universalRoute', () => {
		it('should generate deep link route', () => {
			const result = UtilObject.universalRoute({ id: 'abc', spaceId: 'space1' });
			expect(result).toBe('object?objectId=abc&spaceId=space1');
		});

		it('should return empty string for null object', () => {
			expect(UtilObject.universalRoute(null)).toBe('');
		});
	});

	describe('checkParam', () => {
		it('should provide default routeParam and menuParam', () => {
			const result = UtilObject.checkParam({});
			expect(result.routeParam).toEqual({});
			expect(result.menuParam).toEqual({});
		});

		it('should preserve existing params', () => {
			const result = UtilObject.checkParam({ routeParam: { replace: true } });
			expect(result.routeParam).toEqual({ replace: true });
		});

		it('should handle null input', () => {
			const result = UtilObject.checkParam(null);
			expect(result.routeParam).toEqual({});
		});
	});

	describe('layout type checks', () => {
		it('isInSetLayouts should identify set/collection/type', () => {
			expect(UtilObject.isInSetLayouts(L.Set)).toBe(true);
			expect(UtilObject.isInSetLayouts(L.Collection)).toBe(true);
			expect(UtilObject.isInSetLayouts(L.Type)).toBe(true);
			expect(UtilObject.isInSetLayouts(L.Page)).toBe(false);
		});

		it('isInFileLayouts should identify file types', () => {
			expect(UtilObject.isInFileLayouts(L.File)).toBe(true);
			expect(UtilObject.isInFileLayouts(L.Image)).toBe(true);
			expect(UtilObject.isInFileLayouts(L.Audio)).toBe(true);
			expect(UtilObject.isInFileLayouts(L.Video)).toBe(true);
			expect(UtilObject.isInFileLayouts(L.Pdf)).toBe(true);
			expect(UtilObject.isInFileLayouts(L.Page)).toBe(false);
		});

		it('isInSystemLayouts should identify system types', () => {
			expect(UtilObject.isInSystemLayouts(L.Type)).toBe(true);
			expect(UtilObject.isInSystemLayouts(L.Relation)).toBe(true);
			expect(UtilObject.isInSystemLayouts(L.Option)).toBe(true);
			expect(UtilObject.isInSystemLayouts(L.Dashboard)).toBe(true);
			expect(UtilObject.isInSystemLayouts(L.Page)).toBe(false);
		});

		it('isInPageLayouts should identify page-like layouts', () => {
			expect(UtilObject.isInPageLayouts(L.Page)).toBe(true);
			expect(UtilObject.isInPageLayouts(L.Human)).toBe(true);
			expect(UtilObject.isInPageLayouts(L.Task)).toBe(true);
			expect(UtilObject.isInPageLayouts(L.Note)).toBe(true);
			expect(UtilObject.isInPageLayouts(L.Bookmark)).toBe(true);
			expect(UtilObject.isInPageLayouts(L.File)).toBe(false);
		});

		it('isInHumanLayouts should identify human layouts', () => {
			expect(UtilObject.isInHumanLayouts(L.Human)).toBe(true);
			expect(UtilObject.isInHumanLayouts(L.Participant)).toBe(true);
			expect(UtilObject.isInHumanLayouts(L.Page)).toBe(false);
		});

		it('isInFileOrSystemLayouts should combine file and system', () => {
			expect(UtilObject.isInFileOrSystemLayouts(L.File)).toBe(true);
			expect(UtilObject.isInFileOrSystemLayouts(L.Type)).toBe(true);
			expect(UtilObject.isInFileOrSystemLayouts(L.Page)).toBe(false);
		});
	});

	describe('single layout checks', () => {
		it('isSpaceViewLayout', () => {
			expect(UtilObject.isSpaceViewLayout(L.SpaceView)).toBe(true);
			expect(UtilObject.isSpaceViewLayout(L.Page)).toBe(false);
		});

		it('isSetLayout', () => {
			expect(UtilObject.isSetLayout(L.Set)).toBe(true);
			expect(UtilObject.isSetLayout(L.Collection)).toBe(false);
		});

		it('isCollectionLayout', () => {
			expect(UtilObject.isCollectionLayout(L.Collection)).toBe(true);
			expect(UtilObject.isCollectionLayout(L.Set)).toBe(false);
		});

		it('isTypeLayout', () => {
			expect(UtilObject.isTypeLayout(L.Type)).toBe(true);
			expect(UtilObject.isTypeLayout(L.Page)).toBe(false);
		});

		it('isRelationLayout', () => {
			expect(UtilObject.isRelationLayout(L.Relation)).toBe(true);
			expect(UtilObject.isRelationLayout(L.Page)).toBe(false);
		});

		it('isTypeOrRelationLayout', () => {
			expect(UtilObject.isTypeOrRelationLayout(L.Type)).toBe(true);
			expect(UtilObject.isTypeOrRelationLayout(L.Relation)).toBe(true);
			expect(UtilObject.isTypeOrRelationLayout(L.Page)).toBe(false);
		});

		it('isHumanLayout', () => {
			expect(UtilObject.isHumanLayout(L.Human)).toBe(true);
			expect(UtilObject.isHumanLayout(L.Page)).toBe(false);
		});

		it('isParticipantLayout', () => {
			expect(UtilObject.isParticipantLayout(L.Participant)).toBe(true);
			expect(UtilObject.isParticipantLayout(L.Page)).toBe(false);
		});

		it('isTaskLayout', () => {
			expect(UtilObject.isTaskLayout(L.Task)).toBe(true);
			expect(UtilObject.isTaskLayout(L.Page)).toBe(false);
		});

		it('isNoteLayout', () => {
			expect(UtilObject.isNoteLayout(L.Note)).toBe(true);
			expect(UtilObject.isNoteLayout(L.Page)).toBe(false);
		});

		it('isBookmarkLayout', () => {
			expect(UtilObject.isBookmarkLayout(L.Bookmark)).toBe(true);
			expect(UtilObject.isBookmarkLayout(L.Page)).toBe(false);
		});

		it('isChatLayout', () => {
			expect(UtilObject.isChatLayout(L.Chat)).toBe(true);
			expect(UtilObject.isChatLayout(L.Discussion)).toBe(true);
			expect(UtilObject.isChatLayout(L.Page)).toBe(false);
		});

		it('isImageLayout', () => {
			expect(UtilObject.isImageLayout(L.Image)).toBe(true);
			expect(UtilObject.isImageLayout(L.Page)).toBe(false);
		});

		it('isVideoOrAudioLayout', () => {
			expect(UtilObject.isVideoOrAudioLayout(L.Video)).toBe(true);
			expect(UtilObject.isVideoOrAudioLayout(L.Audio)).toBe(true);
			expect(UtilObject.isVideoOrAudioLayout(L.Page)).toBe(false);
		});

		it('isDateLayout', () => {
			expect(UtilObject.isDateLayout(L.Date)).toBe(true);
			expect(UtilObject.isDateLayout(L.Page)).toBe(false);
		});

		it('isFileLayout', () => {
			expect(UtilObject.isFileLayout(L.File)).toBe(true);
			expect(UtilObject.isFileLayout(L.Page)).toBe(false);
		});

		it('isSpaceLayout', () => {
			expect(UtilObject.isSpaceLayout(L.Space)).toBe(true);
			expect(UtilObject.isSpaceLayout(L.Page)).toBe(false);
		});
	});

	describe('getFileTypeByLayout', () => {
		it('should map Image layout to Image file type', () => {
			expect(UtilObject.getFileTypeByLayout(L.Image)).toBe(2);
		});

		it('should map Audio layout to Audio file type', () => {
			expect(UtilObject.getFileTypeByLayout(L.Audio)).toBe(4);
		});

		it('should map Video layout to Video file type', () => {
			expect(UtilObject.getFileTypeByLayout(L.Video)).toBe(3);
		});

		it('should map Pdf layout to Pdf file type', () => {
			expect(UtilObject.getFileTypeByLayout(L.Pdf)).toBe(5);
		});

		it('should default to File type', () => {
			expect(UtilObject.getFileTypeByLayout(L.Page)).toBe(1);
		});
	});

	describe('layout list getters', () => {
		it('getSetLayouts should return Set, Collection, and Type', () => {
			const layouts = UtilObject.getSetLayouts();
			expect(layouts).toContain(L.Set);
			expect(layouts).toContain(L.Collection);
			expect(layouts).toContain(L.Type);
			expect(layouts).toHaveLength(3);
		});

		it('getFileLayouts should return all file layouts', () => {
			const layouts = UtilObject.getFileLayouts();
			expect(layouts).toContain(L.File);
			expect(layouts).toContain(L.Image);
			expect(layouts).toContain(L.Audio);
			expect(layouts).toContain(L.Video);
			expect(layouts).toContain(L.Pdf);
			expect(layouts).toHaveLength(5);
		});

		it('getPageLayouts should return page-like layouts', () => {
			const layouts = UtilObject.getPageLayouts();
			expect(layouts).toContain(L.Page);
			expect(layouts).toContain(L.Human);
			expect(layouts).toContain(L.Task);
			expect(layouts).toContain(L.Note);
			expect(layouts).toContain(L.Bookmark);
			expect(layouts).toHaveLength(5);
		});

		it('getHumanLayouts should return Human and Participant', () => {
			const layouts = UtilObject.getHumanLayouts();
			expect(layouts).toContain(L.Human);
			expect(layouts).toContain(L.Participant);
			expect(layouts).toHaveLength(2);
		});

		it('getSystemLayouts should return system layouts', () => {
			const layouts = UtilObject.getSystemLayouts();
			expect(layouts).toContain(L.Type);
			expect(layouts).toContain(L.Relation);
			expect(layouts).toContain(L.Option);
			expect(layouts).toContain(L.Dashboard);
			expect(layouts).toContain(L.Space);
			expect(layouts).toContain(L.SpaceView);
			expect(layouts).toContain(L.Discussion);
		});

		it('getFileAndSystemLayouts should combine both', () => {
			const layouts = UtilObject.getFileAndSystemLayouts();
			expect(layouts).toContain(L.File);
			expect(layouts).toContain(L.Type);
		});

		it('excludeFromSet should contain option/space layouts', () => {
			const excluded = UtilObject.excludeFromSet();
			expect(excluded).toContain(L.Option);
			expect(excluded).toContain(L.SpaceView);
			expect(excluded).toContain(L.Space);
		});
	});

});
