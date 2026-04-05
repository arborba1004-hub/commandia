/**
 * Auto-generated entity types
 * Contains all CMS collection interfaces in a single file 
 */

/**
 * Collection ID: accessories
 * @catalog This collection is an eCommerce catalog
 * Interface for AcessriosdeFuga
 */
export interface AcessriosdeFuga {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  itemName?: string;
  /** @wixFieldType text */
  itemDescription?: string;
  /** @wixFieldType number */
  itemPrice?: number;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  itemImage?: string;
  /** @wixFieldType text */
  skillType?: string;
}


/**
 * Collection ID: armasarsenal
 * Interface for ArmasArsenal
 */
export interface ArmasArsenal {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  weaponName?: string;
  /** @wixFieldType text */
  description?: string;
  /** @wixFieldType number */
  level?: number;
  /** @wixFieldType number */
  dirtyMoneyPrice?: number;
  /** @wixFieldType text */
  abilityBonus?: string;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  weaponImage?: string;
}


/**
 * Collection ID: casesdearmas
 * @catalog This collection is an eCommerce catalog
 * Interface for WeaponCases
 */
export interface WeaponCases {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  itemName?: string;
  /** @wixFieldType number */
  itemPrice?: number;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  itemImage?: string;
  /** @wixFieldType text */
  itemDescription?: string;
  /** @wixFieldType text */
  abilityBonusType?: string;
}


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
 * Collection ID: fugavehicles
 * Interface for EscapeVehicles
 */
export interface EscapeVehicles {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  name?: string;
  /** @wixFieldType number */
  level?: number;
  /** @wixFieldType number */
  price?: number;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  image?: string;
  /** @wixFieldType text */
  abilityBonusType?: string;
  /** @wixFieldType text */
  description?: string;
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
