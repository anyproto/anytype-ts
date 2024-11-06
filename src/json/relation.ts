export default {
	default: [
		'id',
		'spaceId',
		'name',
		'description',
		'snippet',
		'iconEmoji',
		'iconImage',
		'iconOption',
		'relationFormat',
		'type',
		'layout',
		'isHidden',
		'isArchived',
		'isReadonly',
		'isDeleted',
		'isFavorite',
		'done',
		'fileExt',
		'fileMimeType',
		'sizeInBytes',
		'restrictions',
		'defaultTemplateId',
		'createdDate',
		'relationOptionColor',
	],

	sidebar: [
		'id',
		'spaceId',
		'name',
		'description',
		'snippet',
		'layout',
		'type',
		'iconEmoji',
		'iconImage',
		'iconOption',
		'isReadonly',
		'isHidden',
		'isDeleted',
		'isArchived',
		'isFavorite',
		'done',
		'relationFormat',
		'fileExt',
		'fileMimeType',
		'links',
		'restrictions',
		'source',
		'lastModifiedDate',
		'lastOpenedDate'
	],

	relation: [
		'id',
		'spaceId',
		'type',
		'layout',
		'name',
		'relationFormat',
		'relationKey',
		'isReadonly',
		'isHidden',
		'isDeleted',
		'isArchived',
		'isFavorite',
		'restrictions',
		'relationMaxCount',
		'relationReadonlyValue',
		'relationDefaultValue',
		'relationFormatObjectTypes',
		'sourceObject',
		'restrictions'
	],

	cover: [
		'coverId',
		'coverType',
		'coverX',
		'coverY',
		'coverScale'
	],

	option: [
		'id',
		'relationKey',
		'type',
		'layout',
		'name',
		'relationOptionColor'
	],

	type: [
		'recommendedRelations',
		'recommendedLayout',
		'sourceObject',
		'uniqueKey',
		'defaultTemplateId',
	],

	graph: [
		'id',
		'name',
		'snippet',
		'description',
		'iconEmoji',
		'iconImage',
		'iconOption',
		'relationFormat',
		'type',
		'layout',
		'done',
		'fileExt',
		'fileMimeType',
		'isDeleted',
		'isArchived',
		'isFavorite',
		'restrictions'
	],

	template: [
		'templateIsBundled',
		'type',
		'targetObjectType',
		'internalFlags',
		'sourceObject'
	],

	space: [
		'spaceDashboardId',
		'spaceAccountStatus',
		'spaceLocalStatus',
		'spaceAccessType',
		'readersLimit',
		'writersLimit',
		'targetSpaceId',
		'creator',
		'createdDate',
		'chatId',
	],

	participant: [
		'identity',
		'participantPermissions',
		'participantStatus',
		'globalName'
	],

	syncStatus: [
		'syncStatus',
		'syncDate',
		'syncError'
	],

	pageCover: 'pageCover',
};
