export default {
	sentry:				 'https://44e6df81644c4e36b21b1dbea62b8a1a@sentry.anytype.io/3',
	amplitude:			 '1ba981d1a9afb8af8c81847ef3383a20',
	googleMaps:			 'AIzaSyAgXu3wCb6mPJv4wNWKe2E3YycaYuqFm9o',
	protocol:			 'anytype',
	appName:			 'Anytype',
	blankRouteId:		 '_blank_',
	storeSpaceId:		 '_anytype_marketplace',
	anytypeProfileId:	 '_anytype_profile',
	fontCode:			 'plex',
	popupPinIds:		 [ 'search' ],
	textColor:			 [ 'grey', 'yellow', 'orange', 'red', 'pink', 'purple', 'blue', 'ice', 'teal', 'lime' ],
	namespace:			 { 0: '.any' },

	count: {
		icon:			 16,
		phrase:			 { letter: 8, word: 12 }
	},
	
	networkId: {
		production:		 'N83gJpVd9MuNRZAuJLZ7LiMntTThhPc6DtzWWVjb1M3PouVU',
		development:	 'N9DU6hLkTAbvcpji3TCKPPd3UQWKGyzUxGmgJEyvhByqAjfD',
		testing:		 'N4N1wDHFpFpovXBqdbq2TDXE9tXdXbtV1eTJFpKJW4YeaJqR'
	},

	platforms: {
		win32:			 'Windows',
		darwin:			 'Mac',
		linux:			 'Linux'
	},

	limit: {
		menuRecords:	 100,
		widgets:		 20,
		space:			 10,
		notification:	 20,
	},

	default: {
		interfaceLang:	 'en-US',
		codeLang:		 'plain',
		typeKey:		 'ot-note',
		pinTime:		 600,
	},

	delay: {
		menu:			 150,
		popup:			 150,
		toast:			 2500,
		route:			 250,
		keyboard:		 500,
		notification:	 200,
		widget:			 400,
		login:			 800,
		sidebar:		 180,
	},

	fileExtension: {
		image:			 [ 'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp' ],
		video:			 [ 'mp4', 'm4v', 'mov' ],
		cover:			 [ 'jpg', 'jpeg', 'png', 'gif', 'webp' ],
		audio:			 [ 'mp3', 'm4a', 'flac', 'ogg', 'wav' ],
		pdf:			 [ 'pdf' ],
		import: {
			1:			 [ 'zip', 'md' ],
			3:			 [ 'zip', 'pb', 'json' ],
			4:			 [ 'zip', 'html', 'htm', 'mhtml' ],
			5:			 [ 'zip', 'txt' ],
		},
	},

	graphId: {
		global:			 'graphGlobal',
		dataview:		 'graphDataview'
	},

	subId: {
		search:			 'search',
		profile:		 'profile',
		deleted:		 'deleted',
		type:			 'type',
		relation:		 'relation',
		option:			 'option',
		store:			 'store',
		archive:		 'archive',
		sidebar:		 'sidebar',
		space:			 'space',
		fileManager:	 'fileManager',
		participant:	 'participant',
		myParticipant:	 'myParticipant'
	},

	typeKey: {
		page:			 'ot-page',
		set:			 'ot-set',
		space:			 'ot-space',
		template:		 'ot-template',
		type:			 'ot-objectType',
		image:			 'ot-image',
		file:			 'ot-file',
		video:			 'ot-video',
		audio:			 'ot-audio',
		relation:		 'ot-relation',
		note:			 'ot-note',
		task:			 'ot-task',
		bookmark:		 'ot-bookmark',
		option:			 'ot-relationOption',
		collection:		 'ot-collection',
		dashboard:		 'ot-dashboard',
		date:			 'ot-date',
		profile:		 'ot-profile',
		chat:			 'ot-chat',
	},

	templateId: {
		blank:			 'blank',
		new:			 'newTemplate'
	},

	blockId: {
		title:			 'title',
		description:	 'description',
		featured:		 'featuredRelations',
		dataview:		 'dataview',
		type:			 'type',
		header:			 'header',
		chat:			 'chat',
	},

	widgetId: {
		favorite:		 'favorite',
		recentEdit:		 'recent',
		recentOpen:		 'recentOpen',
		set:			 'set',
		collection:		 'collection',
		chat:			 'chat',
	},

	monthDays: {
		1:				 31,
		2:				 28,
		3:				 31,
		4:				 30,
		5:				 31,
		6:				 30,
		7:				 31,
		8:				 31,
		9:				 30,
		10:				 31,
		11:				 30,
		12:				 31
	},

};
