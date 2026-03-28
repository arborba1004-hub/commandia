/**
 * Auto-generated entity types
 * Contains all CMS collection interfaces in a single file 
 */

/**
 * Collection ID: conceptart
 * Interface for ConceptArtGallery
 */
export interface ConceptArtGallery {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  artworkTitle?: string;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  artworkImage?: string;
  /** @wixFieldType text */
  artworkDescription?: string;
  /** @wixFieldType text */
  artistName?: string;
  /** @wixFieldType date */
  dateCreated?: Date | string;
}


/**
 * Collection ID: gamemechanics
 * Interface for GameMechanics
 */
export interface GameMechanics {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  title?: string;
  /** @wixFieldType text */
  description?: string;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  mechanicImage?: string;
  /** @wixFieldType text */
  mechanicType?: string;
  /** @wixFieldType number */
  levelRequirement?: number;
  /** @wixFieldType text */
  reward?: string;
}
