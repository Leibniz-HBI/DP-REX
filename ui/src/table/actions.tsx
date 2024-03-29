import { Rectangle } from '@glideapps/glide-data-grid'
import { TagDefinition } from '../column_menu/state'
import { CellValue, Entity } from './state'

export type Edit = [string, string, CellValue]

/**
 * Indicates successful entity fetch.
 */
export class SetEntitiesAction {
    entities: Entity[]
    constructor(entities: Entity[]) {
        this.entities = entities
    }
}
/**
 * Indicates successful data fetch
 */
export class AppendColumnAction {
    idPersistent: string
    columnData: { [key: string]: CellValue[] }
    constructor(idPersistent: string, columnData: { [key: string]: CellValue[] }) {
        this.idPersistent = idPersistent
        this.columnData = columnData
    }
}

/**
 * Indicates the begin of data fetch for table.
 */
export class SetEntityLoadingAction {}
/**
 * Indicates fetching of column data.
 */
export class SetColumnLoadingAction {
    tagDefinition: TagDefinition
    constructor(tagDefinition: TagDefinition) {
        this.tagDefinition = tagDefinition
    }
}
/**
 * Indicates that the menu for adding columns should be shown
 */
export class ShowColumnAddMenuAction {}

/**
 * Indicates that the menu for adding columns should be hidden
 */
export class HideColumnAddMenuAction {}

/** Indicates that a column header menu should be displayed */
export class ShowHeaderMenuAction {
    columnIndex: number
    bounds: Rectangle

    constructor(columnIndex: number, bounds: Rectangle) {
        this.columnIndex = columnIndex
        this.bounds = bounds
    }
}

/**
 * Indicates that the column header menu should be closed
 */
export class HideHeaderMenuAction {}

/**
 *Indicates that the column for which the header menu was open should be deleted.
 */
export class RemoveSelectedColumnAction {}

/**
 * Indicates that the width of a column has changed
 */
export class SetColumnWidthAction {
    columnIdx: number
    width: number
    constructor(columnIdx: number, width: number) {
        this.columnIdx = columnIdx
        this.width = width
    }
}
/**
 * Indicates that a column position has changes
 */
export class ChangeColumnIndexAction {
    startIndex: number
    endIndex: number
    constructor(startIndex: number, endIndex: number) {
        this.startIndex = startIndex
        this.endIndex = endIndex
    }
}

/**
 * Indicates an error during table data fetch.
 */
export class SetLoadDataErrorAction {}

/**
 * Indicates that submitting values has started
 */
export class SubmitValuesStartAction {}

/**
 * Indicates that an error has occurred during value submission
 */

export class SubmitValuesErrorAction {}

/**
 * Indicates that values have been edited.
 */
export class SubmitValuesEndAction {
    edits: Edit[]
    constructor(edits: Edit[]) {
        this.edits = edits
    }
}

/**
 * Indicate that a tag definition has changed
 */
export class TagDefinitionChangeAction {
    tagDefinition: TagDefinition

    constructor(tagDefinition: TagDefinition) {
        this.tagDefinition = tagDefinition
    }
}

/**Indicate start of submitting a curation request */
export class CurateTagDefinitionStartAction {}

/**
 * Indicate a successful curation request
 */
export class CurateTagDefinitionSuccessAction extends TagDefinitionChangeAction {
    constructor(tagDefinition: TagDefinition) {
        super(tagDefinition)
    }
}

/**
 * Indicate an error during a curation request
 */
export class CurateTagDefinitionErrorAction {}

/**
 * Indicate that a tag ownership change UI element should be shown
 */
export class TagChangeOwnershipShowAction {
    columnDefinition: TagDefinition
    constructor(columnDefinition: TagDefinition) {
        this.columnDefinition = columnDefinition
    }
}

/**
 * Indicate that the tag ownership change UI element should be hidden.
 */
export class TagChangeOwnershipHideAction {}

/**
 * Indicate the start of adding or changing an entity
 */
export class EntityChangeOrCreateStartAction {}

/**
 * Indicate success of changing or creating an entity
 */
export class EntityChangeOrCreateSuccessAction {
    entity: Entity
    constructor(entity: Entity) {
        this.entity = entity
    }
}

/**
 * Indicate an error during changing or creating an entity
 */
export class EntityChangeOrCreateErrorAction {}

/**
 * Indicate that the entity add dialog should be shown or hidden.
 */
export class ShowEntityAddDialogAction {
    show: boolean
    constructor(show: boolean) {
        this.show = show
    }
}

/**
 * Indicate wether the entity duplicate overlay should be shown.
 */
export class ToggleEntityModalAction {
    show: boolean
    constructor(show: boolean) {
        this.show = show
    }
}
/**
 * Indicate to show or hide the search
 */
export class ToggleShowSearchAction {
    show: boolean
    constructor(show: boolean) {
        this.show = show
    }
}

export type TableAction =
    | SetEntitiesAction
    | AppendColumnAction
    | SetEntityLoadingAction
    | SetColumnLoadingAction
    | ShowColumnAddMenuAction
    | HideColumnAddMenuAction
    | ShowHeaderMenuAction
    | HideHeaderMenuAction
    | RemoveSelectedColumnAction
    | SetColumnWidthAction
    | ChangeColumnIndexAction
    | SetLoadDataErrorAction
    | SubmitValuesStartAction
    | SubmitValuesErrorAction
    | SubmitValuesEndAction
    | CurateTagDefinitionStartAction
    | CurateTagDefinitionSuccessAction
    | CurateTagDefinitionErrorAction
    | TagChangeOwnershipShowAction
    | TagChangeOwnershipHideAction
    | TagDefinitionChangeAction
    | EntityChangeOrCreateStartAction
    | EntityChangeOrCreateSuccessAction
    | EntityChangeOrCreateErrorAction
    | ShowEntityAddDialogAction
    | ToggleEntityModalAction
    | ToggleShowSearchAction
