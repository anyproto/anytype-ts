{
	'targets': [
		{
			'target_name': 'addon',
			'sources': [ 'addon.c' ],
			'libraries': [ '<!(pwd)/lib.so' ]
		}
	]
}