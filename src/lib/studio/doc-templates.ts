/**
 * Document Templates for Shared Living Documents
 *
 * Provides initial templates for each shared document type.
 * These templates are returned when a document doesn't exist yet,
 * giving users and AI a starting structure.
 *
 * Phase 7b: Unified Documentation System
 */

/** Valid shared document types */
export type SharedDocumentType =
  | 'game-design.md'
  | 'asset-inventory.md'
  | 'scene-notes.md'
  | 'development-log.md';

/**
 * Get the template for a game design document
 *
 * Contains placeholders for game concept, audience, features, mechanics
 */
export function getGameDesignTemplate(): string {
  return `# Game Design Document

## Concept
_Brief description of your game concept and vision..._

## Target Audience
_Who is this game for? What experience level?_

## Key Features
- Feature 1
- Feature 2
- Feature 3

## Gameplay Mechanics
_Describe core gameplay mechanics..._

## Visual Style
_Reference style anchor or describe visual direction..._

## Notes
_Additional design notes..._
`;
}

/**
 * Get the template for an asset inventory document
 *
 * Contains sections for characters, environments, and items
 */
export function getAssetInventoryTemplate(): string {
  return `# Asset Inventory

## Characters
_No characters yet. Assets will be added automatically when generated._

## Environments
_No environments yet. Skyboxes and backgrounds will be added here._

## Items
_No items yet._

## Notes
_Asset notes and relationships..._
`;
}

/**
 * Get the template for scene notes document
 *
 * Contains sections for level design, camera, and placement hints
 */
export function getSceneNotesTemplate(): string {
  return `# Scene Notes

## Main Level
### Recommended Camera
- Type: ArcRotateCamera
- Radius: 25
- Height Offset: 8

### Player Start Position
- x: 0
- y: 0
- z: 0

### Recommended Asset Placements
_Add placement hints here..._

## Level 2
_Add more levels as needed..._
`;
}

/**
 * Get the template for development log document
 *
 * Contains sections for decisions, patterns, and gotchas
 */
export function getDevelopmentLogTemplate(): string {
  const today = new Date().toISOString().split('T')[0];
  return `# Development Log

## ${today}
### Project Started
- Initial game setup
- _Add decisions and patterns discovered during development_

### Gotchas
_Document any gotchas or patterns that future sessions should know about_

### Code Patterns
_Document reusable code patterns_
`;
}

/**
 * Get template for a specific document type
 *
 * @param docType - The type of document
 * @returns Template string for the document
 */
export function getDocTemplate(docType: SharedDocumentType): string {
  switch (docType) {
    case 'game-design.md':
      return getGameDesignTemplate();
    case 'asset-inventory.md':
      return getAssetInventoryTemplate();
    case 'scene-notes.md':
      return getSceneNotesTemplate();
    case 'development-log.md':
      return getDevelopmentLogTemplate();
    default:
      return `# Document\n\n_Content goes here_`;
  }
}

/**
 * Get all document templates as a record
 *
 * @returns Record mapping document types to their templates
 */
export function getDocTemplates(): Record<SharedDocumentType, string> {
  return {
    'game-design.md': getGameDesignTemplate(),
    'asset-inventory.md': getAssetInventoryTemplate(),
    'scene-notes.md': getSceneNotesTemplate(),
    'development-log.md': getDevelopmentLogTemplate(),
  };
}
