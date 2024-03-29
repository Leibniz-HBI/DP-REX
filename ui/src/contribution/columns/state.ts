import { TagSelectionEntry, TagType } from '../../column_menu/state'
import { RemoteInterface, newRemote } from '../../util/state'

export interface ColumnDefinitionContribution {
    name: string
    idPersistent: string
    idExistingPersistent?: string
    idParentPersistent?: string
    type?: TagType
    indexInFile: number
    discard: boolean
}
export function newColumnDefinitionContribution({
    name,
    idPersistent,
    idExistingPersistent = undefined,
    idParentPersistent = undefined,
    type = undefined,
    indexInFile,
    discard
}: {
    name: string
    idPersistent: string
    idExistingPersistent?: string
    idParentPersistent?: string
    type?: TagType
    indexInFile: number
    discard: boolean
}): ColumnDefinitionContribution {
    return {
        name: name,
        idPersistent: idPersistent,
        idExistingPersistent: idExistingPersistent,
        idParentPersistent: idParentPersistent,
        type: type,
        indexInFile: indexInFile,
        discard: discard
    }
}

export type ColumnsTuple = {
    activeDefinitionsList: ColumnDefinitionContribution[]
    discardedDefinitionsList: ColumnDefinitionContribution[]
}

export interface ColumnDefinitionsContributionState {
    columns: RemoteInterface<ColumnsTuple | undefined>
    selectedColumnDefinition: RemoteInterface<ColumnDefinitionContribution | undefined>
    createTabSelected: boolean
    finalizeColumnAssignment: RemoteInterface<boolean>
}
export function newColumnDefinitionsContributionState({
    columns = newRemote(undefined),
    selectedColumnDefinition = newRemote(undefined),
    createTabSelected = false,
    finalizeColumnAssignment = newRemote(false)
}: {
    columns?: RemoteInterface<ColumnsTuple | undefined>
    selectedColumnDefinition?: RemoteInterface<ColumnDefinitionContribution | undefined>
    createTabSelected?: boolean
    existingColumnSelectionEntries?: RemoteInterface<TagSelectionEntry[]>
    finalizeColumnAssignment?: RemoteInterface<boolean>
}): ColumnDefinitionsContributionState {
    return {
        columns: columns,
        selectedColumnDefinition: selectedColumnDefinition,
        createTabSelected: createTabSelected,
        finalizeColumnAssignment: finalizeColumnAssignment
    }
}
