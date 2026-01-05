# Running notes for implementing transclusions

- the feature has been requested many times
- the canonical source of the discussion is at https://community.anytype.io/t/add-block-linking-synced-embedded-blocks/1360/8

# Potential blockers
- 2023-nov-27 Townhall
    - https://community.anytype.io/t/add-block-linking-synced-embedded-blocks/1360/37
    - cryptography makes it challenging to link to a block in another page
    - resolved by using Any Store. [GO-3663](https://github.com/anyproto/anytype-heart/pull/1374)
- 2024-jan-30 discourse
    - https://community.anytype.io/t/add-block-linking-synced-embedded-blocks/1360/48
    - The problem with this general feature request is that our current architecture does not allow editing object blocks while you are in another object. It only allows for previewing other objects and editing their relationships. Therefore, we are considering adding a new layout, ‘block or citation,’ which would consist of a single paragraph serving as the name of this object. This way, we can transform any block into an object with this layout, allowing it to be transcluded or collected in a set. You will be able to tag them, etc. However, at this stage, it will not be possible to use markup for this block
- 2024-aug-26
    - https://community.anytype.io/t/add-block-linking-synced-embedded-blocks/1360/74
    -  Yes! We just moved to a new datastore which would allow us to make transclusions easily. We start to use it with chats, than move collections to it, later it’ll be editor. We may start to work on it the beginning of the next year

# Related back-end features
## `Content.Bookmark`
- `* Bookmark is to keep a web-link and to preview a content.`
- information comes from `targetObjectId`

## `Content.Link`
- `* Link: block to link some content from an external sources.`
- `targetBlockId` is a misnomer. It is an object link.

# Justification for BlockTransclusion React component
It needs to load other objects. We might instead prefer to have a dataloading phase, and then no separate React component for transclusions.

# Larger questions
- Is there any infrastructure for deep links blocks?
    - Can that same referencing mechanism be used for transclusions?
- Does Anytype have a concept of block grouping?
- Why is there interest in "blocks as objects"? Objects can be linked to already. The UI has a feature where you can turn a block into an object. But it changes its appearance.
- How does Anytype handle beta features generally? Are there feature flags? Is there anything like "this feature is in development"? Antype 'labs'?


# Terminology note
In the vernacular of "linking", the link *target* represents the *source* of truth.

# Design
## How do you distinguish between copy-pasting as a duplicate versus pasting as a transclusion?
At the moment, it is decide-on-copy.

### Decide on paste
Prompt similar to pasting URL
- maybe each transclusion source should be an object, just like a URL bookmark is an object.

### Decide on copy
Make a new "copy as reference" command that does the same thing, but sets some state in the clipboard to indicate the desired pasting.


## Should the source block indicate that it is transcluded?
Currently, no.

## How should the system handle "recursive transclusions"
add a toggle for expanding?
persist the toggle state?
no toggle at first. only <RECURSIVE TRANSCLUSION> + a tooltip that shows "this feature of Anytype is in development".

## How to link back to source block?

# Future features
- indicate when a block is a transclusion source
- warn/error on deleting source block that has transclusion references
    - deleting a bookmark or object permanently shows `Non-existent object` with no warning, so maybe transclusions should behave the same.
- live updates in the front end
- change source block (swap a transclusion and the original, updating all transclusions)

