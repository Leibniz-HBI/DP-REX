import { Dispatch } from 'react'
import { errorMessageFromApi, exceptionMessage } from '../util/exception'
import {
    TableAction,
    SetEntityLoadingAction,
    SetLoadDataErrorAction,
    SetEntitiesAction,
    AppendColumnAction,
    SetColumnLoadingAction,
    Edit,
    SubmitValuesStartAction,
    SubmitValuesEndAction,
    SubmitValuesErrorAction,
    CurateTagDefinitionStartAction,
    CurateTagDefinitionErrorAction,
    CurateTagDefinitionSuccessAction,
    EntityChangeOrCreateStartAction,
    EntityChangeOrCreateSuccessAction,
    EntityChangeOrCreateErrorAction
} from './actions'
import { AsyncAction } from '../util/async_action'
import { fetch_chunk } from '../util/fetch'
import { TagDefinition, TagType } from '../column_menu/state'
import { CellValue, Entity, newEntity } from './state'
import { config } from '../config'
import { newErrorState } from '../util/error/slice'
import { constructColumnTitle } from '../contribution/entity/hooks'
import { parseColumnDefinitionsFromApi } from '../column_menu/thunks'

const displayTxtColumnId = 'display_txt_id'
/**
 * Async action for fetching table data.
 */
export class GetTableAsyncAction extends AsyncAction<TableAction, void> {
    async run(dispatch: Dispatch<TableAction>) {
        dispatch(new SetEntityLoadingAction())
        dispatch(
            new SetColumnLoadingAction({
                namePath: ['Display Text'],
                idPersistent: displayTxtColumnId,
                columnType: TagType.String,
                curated: true,
                version: 0,
                hidden: false
            })
        )
        try {
            const entities: Entity[] = []
            const displayTxts: { [key: string]: CellValue[] } = {}
            for (let i = 0; ; i += 500) {
                const rsp = await fetch_chunk({
                    api_path: config.api_path + '/persons/chunk',
                    offset: i,
                    limit: 500
                })
                if (rsp.status == 404) {
                    new SetEntitiesAction([])
                    return
                } else if (rsp.status !== 200) {
                    dispatch(
                        new SetLoadDataErrorAction(
                            newErrorState(
                                `Could not load entities chunk ${i}. Reason: "${
                                    (await rsp.json())['msg']
                                }"`
                            )
                        )
                    )
                    return
                }
                const json = await rsp.json()
                const rowsApi = json['persons']
                if (rowsApi !== null) {
                    for (const entry_json of rowsApi) {
                        const entity = parseEntityObjectFromJson(entry_json)
                        entities.push(entity)
                        displayTxts[entity.idPersistent] = [
                            {
                                value: entity.displayTxt,
                                idPersistent: entity.idPersistent,
                                version: entity.version
                            }
                        ]
                    }
                }
                if (rowsApi.length < 500) {
                    break
                }
            }
            dispatch(new SetEntitiesAction(entities))
            dispatch(new AppendColumnAction(displayTxtColumnId, displayTxts))
        } catch (e: unknown) {
            dispatch(new SetLoadDataErrorAction(newErrorState(exceptionMessage(e))))
        }
    }
}

export class GetColumnAsyncAction extends AsyncAction<TableAction, void> {
    columnDefinition: TagDefinition

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(column_definition: TagDefinition) {
        super()
        this.columnDefinition = column_definition
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async run(dispatch: Dispatch<TableAction>): Promise<void> {
        const id_persistent = this.columnDefinition.idPersistent
        try {
            dispatch(new SetColumnLoadingAction(this.columnDefinition))
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const column_data: { [key: string]: CellValue[] } = {}
            let offset = 0
            for (let i = 0; ; i += 5000) {
                const rsp = await fetch_chunk({
                    api_path: config.api_path + '/tags/chunk',
                    offset,
                    limit: 5000,
                    payload: {
                        id_tag_definition_persistent: id_persistent
                    }
                })
                if (rsp.status !== 200) {
                    dispatch(
                        new SetLoadDataErrorAction(
                            newErrorState(
                                `Could not load entities chunk ${i}. Reason: "${
                                    (await rsp.json())['msg']
                                }"`
                            )
                        )
                    )
                    return
                }
                const json = await rsp.json()
                const tags = json['tag_instances']
                for (const tag of tags) {
                    const id_entity_persistent: string = tag['id_entity_persistent']
                    const valueString = tag['value']
                    const valueIdPersistent = tag['id_persistent']
                    const valueVersion = Number.parseInt(tag['version'])
                    const parsedValue = parseValue(
                        this.columnDefinition.columnType,
                        valueString
                    )
                    const versionedValue = {
                        value: parsedValue,
                        idPersistent: valueIdPersistent,
                        version: valueVersion
                    }
                    column_data[id_entity_persistent] = [versionedValue]
                }
                if (tags.length < 5000) {
                    break
                } else {
                    offset =
                        Math.max(
                            ...tags.map(
                                (tagJson: { [key: string]: unknown }) =>
                                    tagJson['version']
                            )
                        ) + 1
                }
            }
            dispatch(new AppendColumnAction(id_persistent, column_data))
        } catch (e: unknown) {
            dispatch(new SetLoadDataErrorAction(newErrorState(exceptionMessage(e))))
        }
    }
}

export class SubmitValuesAsyncAction extends AsyncAction<TableAction, void> {
    edit: Edit
    columnType: TagType

    constructor(columnType: TagType, edit: Edit) {
        super()
        this.columnType = columnType
        this.edit = edit
    }
    async run(dispatch: Dispatch<TableAction>) {
        dispatch(new SubmitValuesStartAction())
        try {
            const rsp = await fetch(config.api_path + '/tags', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tag_instances: [
                        {
                            id_entity_persistent: this.edit[0],
                            id_tag_definition_persistent: this.edit[1],
                            value: this.edit[2].value,
                            id_persistent: this.edit[2].idPersistent,
                            version: this.edit[2].version
                        }
                    ]
                })
            })
            const json = await rsp.json()
            if (rsp.status == 200) {
                const tagInstance = json['tag_instances'][0]

                dispatch(new SubmitValuesEndAction([this.extractEdit(tagInstance)]))
                return
            }
            if (rsp.status == 409) {
                const tagInstance = json['tag_instances'][0]
                dispatch(new SubmitValuesEndAction([this.extractEdit(tagInstance)]))
                dispatch(
                    new SubmitValuesErrorAction(
                        newErrorState(
                            'The data you entered changed in the remote location. ' +
                                'The new values are updated in the table. Please review them.'
                        )
                    )
                )
                return
            }
            if (rsp.status == 403) {
                const namePath = constructColumnTitle(
                    json['name_path'] ?? json['name'] ?? ['UNKNOWN']
                )
                dispatch(
                    new SubmitValuesErrorAction(
                        newErrorState(
                            `You do not have sufficient permissions to change values for tag ${namePath}`
                        )
                    )
                )
                return
            }
            const msg = json['msg']
            dispatch(new SubmitValuesErrorAction(newErrorState(msg)))
        } catch (e: unknown) {
            dispatch(
                new SubmitValuesErrorAction(
                    newErrorState('Unknown error: ' + exceptionMessage(e))
                )
            )
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    extractEdit(tagInstance: { [key: string]: any }): Edit {
        return [
            this.edit[0],
            this.edit[1],
            {
                value: parseValue(this.columnType, tagInstance['value']),
                version: tagInstance['version'],
                idPersistent: tagInstance['id_persistent']
            }
        ]
    }
}

export class EntityChangeOrCreateAction extends AsyncAction<TableAction, void> {
    idPersistent?: string
    version?: number
    displayTxt: string
    disabled: boolean

    constructor({
        displayTxt,
        idPersistent = undefined,
        version = undefined,
        disabled
    }: {
        displayTxt: string
        idPersistent?: string
        version?: number
        disabled: boolean
    }) {
        super()
        this.displayTxt = displayTxt
        this.idPersistent = idPersistent
        this.version = version
        this.disabled = disabled
    }

    async run(dispatch: Dispatch<TableAction>): Promise<void> {
        dispatch(new EntityChangeOrCreateStartAction())
        try {
            const rsp = await fetch(config.api_path + '/persons', {
                credentials: 'include',
                method: 'POST',
                body: JSON.stringify({
                    persons: [
                        {
                            display_txt: this.displayTxt,
                            id_persistent: this.idPersistent,
                            version: this.version
                        }
                    ]
                })
            })
            const json = await rsp.json()
            if (rsp.status == 200) {
                const entity = json['persons'][0]
                const idPersistent = entity['id_persistent']
                const displayTxt = entity['display_txt']
                const version = entity['version']
                const disabled = entity['disabled']
                dispatch(
                    new EntityChangeOrCreateSuccessAction({
                        idPersistent,
                        displayTxt,
                        version,
                        disabled
                    })
                )
            } else {
                dispatch(new EntityChangeOrCreateErrorAction(errorMessageFromApi(json)))
            }
        } catch (e: unknown) {
            dispatch(new EntityChangeOrCreateErrorAction(exceptionMessage(e)))
        }
    }
}

export class CurateAction extends AsyncAction<TableAction, void> {
    idTagDefinitionPersistent: string

    constructor(idTagDefinitionPersistent: string) {
        super()
        this.idTagDefinitionPersistent = idTagDefinitionPersistent
    }
    async run(dispatch: Dispatch<TableAction>): Promise<void> {
        dispatch(new CurateTagDefinitionStartAction())
        try {
            const rsp = await fetch(
                config.api_path +
                    `/tags/definitions/permissions/${this.idTagDefinitionPersistent}/curate`,
                {
                    credentials: 'include',
                    method: 'POST'
                }
            )
            const json = await rsp.json()
            if (rsp.status == 200) {
                dispatch(
                    new CurateTagDefinitionSuccessAction(
                        parseColumnDefinitionsFromApi(json)
                    )
                )
            } else {
                dispatch(new CurateTagDefinitionErrorAction(newErrorState(json['msg'])))
            }
        } catch (e: unknown) {
            dispatch(
                new CurateTagDefinitionErrorAction(newErrorState(exceptionMessage(e)))
            )
        }
    }
}

export function parseValue(
    columnType: TagType,
    valueString: string
): number | boolean | string | undefined {
    try {
        if (columnType === TagType.Float) {
            return Number.parseFloat(valueString)
        }
        if (columnType === TagType.Inner) {
            return valueString.toLowerCase() == 'true'
        }
        return valueString
    } catch (e: unknown) {
        return undefined
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseEntityObjectFromJson(json: any) {
    return newEntity({
        idPersistent: json['id_persistent'],
        displayTxt: json['display_txt'],
        version: Number.parseInt(json['version']),
        disabled: json['disabled']
    })
}
