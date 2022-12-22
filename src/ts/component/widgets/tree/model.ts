import { I } from 'Lib';

type UniversalNodeProperties = {
    depth: number; // the depth of the node in the tree
    numChildren: number; // the number of children of the node
    isOpen: boolean; // whether the node is toggled open or closed
    withPadding: boolean; // whether the node should be padded
};

export type TreeSection = {
    id: I.TabIndex; 
    name: string; // the name displayed in the tree UI
    limit: number; // the maximum number of children to display
    isSection: true;
} & UniversalNodeProperties;

export type TreeChild = {
    id: string;
    details: { [key: string]: any }; // the object details
    parentId: string; // the id of the parent node
    sectionId: I.TabIndex; // the id of the section node (root node)
    isSection?: false;
} & UniversalNodeProperties;

export type TreeNode = TreeChild | TreeSection;