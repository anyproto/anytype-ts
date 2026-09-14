import { LocalApiPermission, type LinkAppGrant } from '../interface/linkApproval';

/** No implicit all-spaces fallback: an empty selection is never a grant. */
export const isValidLinkGrant = (grant?: LinkAppGrant): boolean => {
	if (!grant || !Array.isArray(grant.spaceIds) || (typeof grant.allSpaces != 'boolean')) {
		return false;
	};

	if (![ LocalApiPermission.Read, LocalApiPermission.ReadWrite ].includes(grant.perm)) {
		return false;
	};

	return grant.allSpaces ? !grant.spaceIds.length : (
		!!grant.spaceIds.length && grant.spaceIds.every(id => (typeof id == 'string') && !!id.trim())
	);
};

export const linkApprovalGrant = (spaceIds: string[], allSpaces: boolean, perm: LocalApiPermission): LinkAppGrant => ({
	spaceIds: allSpaces ? [] : Array.from(new Set(spaceIds)),
	allSpaces,
	perm,
});
