import { ColumnType, newColumnDefinition } from '../../../column_menu/state'
import { Remote } from '../../../util/state'
import {
    CompleteEntityAssignmentErrorAction,
    CompleteEntityAssignmentStartAction,
    CompleteEntityAssignmentSuccessAction,
    GetContributionEntitiesErrorAction,
    GetContributionEntitiesStartAction,
    GetContributionEntitiesSuccessAction,
    GetContributionEntityDuplicatesErrorAction,
    GetContributionEntityDuplicatesStartAction,
    GetContributionEntityDuplicatesSuccessAction,
    GetContributionTagInstancesErrorAction,
    GetContributionTagInstancesStartAction,
    GetContributionTagInstancesSuccessAction,
    PutDuplicateErrorAction,
    PutDuplicateStartAction,
    PutDuplicateSuccessAction
} from '../action'
import {
    CompleteEntityAssignmentAction,
    GetContributionEntitiesAction,
    GetContributionEntityDuplicateCandidatesAction,
    GetContributionTagInstancesAsyncAction,
    PutDuplicateAction
} from '../async_actions'
import { Entity, EntityWithDuplicates, ScoredEntity, TagInstance } from '../state'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function responseSequence(responses: [number, () => any][]) {
    global.fetch = jest.fn()
    for (const tpl of responses) {
        const [status_code, rsp] = tpl
        ;(global.fetch as jest.Mock).mockImplementationOnce(
            jest.fn(() =>
                Promise.resolve({
                    status: status_code,
                    json: () => Promise.resolve(rsp())
                })
            ) as jest.Mock
        )
    }
}

const idContributionTest = 'contribution_id'
const testPersonRsp0 = {
    display_txt: 'test display txt 0',
    id_persistent: 'test-id-0',
    version: 0
}
const testPersonRsp1 = {
    display_txt: 'test display txt 1',
    id_persistent: 'test-id-1',
    version: 1
}

describe('get entities', () => {
    const testPersonContribution0 = new EntityWithDuplicates({
        idPersistent: 'test-id-0',
        displayTxt: 'test display txt 0',
        version: 0,
        similarEntities: new Remote([])
    })
    const testPersonContribution1 = new EntityWithDuplicates({
        idPersistent: 'test-id-1',
        displayTxt: 'test display txt 1',
        version: 1,
        similarEntities: new Remote([])
    })
    test('success one chunk', async () => {
        responseSequence([
            [
                200,
                () => {
                    return {
                        persons: [testPersonRsp0, testPersonRsp1]
                    }
                }
            ],
            [
                200,
                () => {
                    return {
                        persons: []
                    }
                }
            ]
        ])
        const dispatch = jest.fn()
        await new GetContributionEntitiesAction(idContributionTest).run(dispatch)
        expect(dispatch.mock.calls).toEqual([
            [new GetContributionEntitiesStartAction()],
            [
                new GetContributionEntitiesSuccessAction([
                    testPersonContribution0,
                    testPersonContribution1
                ])
            ]
        ])
    })
    test('success two chunks', async () => {
        responseSequence([
            [
                200,
                () => {
                    return {
                        persons: [testPersonRsp0]
                    }
                }
            ],
            [
                200,
                () => {
                    return {
                        persons: [testPersonRsp1]
                    }
                }
            ],
            [
                200,
                () => {
                    return {
                        persons: []
                    }
                }
            ]
        ])
        const dispatch = jest.fn()
        await new GetContributionEntitiesAction(idContributionTest).run(dispatch)
        expect(dispatch.mock.calls).toEqual([
            [new GetContributionEntitiesStartAction()],
            [
                new GetContributionEntitiesSuccessAction([
                    testPersonContribution0,
                    testPersonContribution1
                ])
            ]
        ])
    })
    test('error', async () => {
        responseSequence([
            [
                200,
                () => {
                    return {
                        persons: [testPersonRsp0, testPersonRsp1]
                    }
                }
            ],
            [
                400,
                () => {
                    return {
                        msg: 'error'
                    }
                }
            ]
        ])
        const dispatch = jest.fn()
        await new GetContributionEntitiesAction(idContributionTest).run(dispatch)
        expect(dispatch.mock.calls).toEqual([
            [new GetContributionEntitiesStartAction()],
            [new GetContributionEntitiesErrorAction('error')]
        ])
    })
})
describe('get duplicate candidates', () => {
    test('success', async () => {
        responseSequence([
            [
                200,
                () => {
                    return {
                        matches: {
                            'id-test-3': {
                                matches: [
                                    {
                                        similarity: 0.8,
                                        entity: testPersonRsp0
                                    },
                                    { similarity: 0.7, entity: testPersonRsp1 }
                                ],
                                assigned_duplicate: testPersonRsp0
                            },
                            'id-test-4': {
                                matches: [{ similarity: 0.9, entity: testPersonRsp1 }],
                                assigned_duplicate: null
                            }
                        }
                    }
                }
            ]
        ])
        const dispatch = jest.fn()
        await new GetContributionEntityDuplicateCandidatesAction({
            idContributionPersistent: idContributionTest,
            entityIdPersistentList: ['id-test-3', 'id-test-4']
        }).run(dispatch)
        expect(dispatch.mock.calls).toEqual([
            [new GetContributionEntityDuplicatesStartAction('id-test-3')],
            [new GetContributionEntityDuplicatesStartAction('id-test-4')],
            [
                new GetContributionEntityDuplicatesSuccessAction(
                    'id-test-3',
                    [
                        new ScoredEntity({
                            idPersistent: 'test-id-0',
                            displayTxt: 'test display txt 0',
                            version: 0,
                            similarity: 0.8
                        }),
                        new ScoredEntity({
                            idPersistent: 'test-id-1',
                            displayTxt: 'test display txt 1',
                            version: 1,
                            similarity: 0.7
                        })
                    ],

                    new Entity({
                        displayTxt: 'test display txt 0',
                        idPersistent: 'test-id-0',
                        version: 0
                    })
                )
            ],
            [
                new GetContributionEntityDuplicatesSuccessAction('id-test-4', [
                    new ScoredEntity({
                        idPersistent: 'test-id-1',
                        displayTxt: 'test display txt 1',
                        version: 1,
                        similarity: 0.9
                    })
                ])
            ]
        ])
    })
    test('error', async () => {
        responseSequence([
            [
                400,
                () => {
                    return { msg: 'error' }
                }
            ]
        ])
        const dispatch = jest.fn()
        await new GetContributionEntityDuplicateCandidatesAction({
            idContributionPersistent: idContributionTest,
            entityIdPersistentList: ['id-test-3', 'id-test-4']
        }).run(dispatch)
        expect(dispatch.mock.calls).toEqual([
            [new GetContributionEntityDuplicatesStartAction('id-test-3')],
            [new GetContributionEntityDuplicatesStartAction('id-test-4')],
            [new GetContributionEntityDuplicatesErrorAction('id-test-3', 'error')],
            [new GetContributionEntityDuplicatesErrorAction('id-test-4', 'error')]
        ])
    })
})

describe('complete entity assignment', () => {
    test('success', async () => {
        responseSequence([
            [
                200,
                () => {
                    return {}
                }
            ]
        ])
        const dispatch = jest.fn()
        await new CompleteEntityAssignmentAction(idContributionTest).run(dispatch)
        expect(dispatch.mock.calls).toEqual([
            [new CompleteEntityAssignmentStartAction()],
            [new CompleteEntityAssignmentSuccessAction()]
        ])
    })
    test('error', async () => {
        responseSequence([
            [
                400,
                () => {
                    return { msg: 'error' }
                }
            ]
        ])
        const dispatch = jest.fn()
        await new CompleteEntityAssignmentAction(idContributionTest).run(dispatch)
        expect(dispatch.mock.calls).toEqual([
            [new CompleteEntityAssignmentStartAction()],
            [new CompleteEntityAssignmentErrorAction('error')]
        ])
    })
})

describe('put duplicate', () => {
    test('success with entity', async () => {
        responseSequence([
            [
                200,
                () => {
                    return {
                        assigned_duplicate: testPersonRsp0
                    }
                }
            ]
        ])
        const dispatch = jest.fn()
        await new PutDuplicateAction({
            idContributionPersistent: idContributionTest,
            idEntityOriginPersistent: 'id-origin-test',
            idEntityDestinationPersistent: 'test-id-0'
        }).run(dispatch)
        expect(dispatch.mock.calls).toEqual([
            [new PutDuplicateStartAction('id-origin-test')],
            [
                new PutDuplicateSuccessAction(
                    'id-origin-test',
                    new Entity({
                        idPersistent: 'test-id-0',
                        displayTxt: 'test display txt 0',
                        version: 0
                    })
                )
            ]
        ])
    })
    test('success with null', async () => {
        responseSequence([
            [
                200,
                () => {
                    return {
                        assigned_duplicate: null
                    }
                }
            ]
        ])
        const dispatch = jest.fn()
        await new PutDuplicateAction({
            idContributionPersistent: idContributionTest,
            idEntityOriginPersistent: 'id-origin-test',
            idEntityDestinationPersistent: 'test-id-0'
        }).run(dispatch)
        expect(dispatch.mock.calls).toEqual([
            [new PutDuplicateStartAction('id-origin-test')],
            [new PutDuplicateSuccessAction('id-origin-test')]
        ])
    })
    test('error', async () => {
        responseSequence([
            [
                400,
                () => {
                    return { msg: 'error' }
                }
            ]
        ])
        const dispatch = jest.fn()
        await new PutDuplicateAction({
            idContributionPersistent: idContributionTest,
            idEntityOriginPersistent: 'id-origin-test',
            idEntityDestinationPersistent: 'test-id-0'
        }).run(dispatch)
        expect(dispatch.mock.calls).toEqual([
            [new PutDuplicateStartAction('id-origin-test')],
            [new PutDuplicateErrorAction('id-origin-test', 'error')]
        ])
    })
})

describe('tag instances', () => {
    const idTagRelated = 'id-tag-related'
    const idTagRequested = 'id-tag-requested'
    const idEntity = 'id-entity-test'
    const idEntity1 = 'id-entity-test1'
    const value = 'value-test'
    const value1 = 'value-test1'
    const idInstance = 'id-instance-test'
    const idInstance1 = 'id-instance-test1'
    const version = 4
    const version1 = 8
    test('success', async () => {
        responseSequence([
            [
                200,
                () => {
                    return {
                        value_responses: [
                            {
                                is_existing: true,
                                id_tag_definition_requested_persistent: idTagRequested,
                                id_entity_persistent: idEntity,
                                id_tag_definition_persistent: idTagRequested,
                                value,
                                id_persistent: idInstance,
                                version: version
                            },
                            {
                                is_existing: false,
                                id_tag_definition_requested_persistent: idTagRequested,
                                id_entity_persistent: idEntity1,
                                id_tag_definition_persistent: idTagRelated,
                                value: value1,
                                id_persistent: idInstance1,
                                version: version1
                            }
                        ]
                    }
                }
            ]
        ])
        const dispatch = jest.fn()
        const entityGroupMap = new Map([[idEntity, [idEntity, idEntity1]]])
        const tagDefinitionList = [
            newColumnDefinition({
                namePath: ['tag def test'],
                idPersistent: idTagRequested,
                columnType: ColumnType.String,
                curated: false,
                version: 3
            })
        ]
        await new GetContributionTagInstancesAsyncAction({
            entitiesGroupMap: entityGroupMap,
            tagDefinitionList: tagDefinitionList,
            idContributionPersistent: 'id-contribution-test'
        }).run(dispatch)
        expect(dispatch.mock.calls).toEqual([
            [
                new GetContributionTagInstancesStartAction(
                    entityGroupMap,
                    tagDefinitionList
                )
            ],
            [
                new GetContributionTagInstancesSuccessAction(
                    entityGroupMap,
                    tagDefinitionList,
                    [
                        new TagInstance(idEntity, idTagRequested, {
                            idPersistent: idInstance,
                            value: value,
                            version: version,
                            isExisting: true,
                            isRequested: true
                        }),
                        new TagInstance(idEntity1, idTagRequested, {
                            idPersistent: idInstance1,
                            value: value1,
                            version: version1,
                            isExisting: false,
                            isRequested: false
                        })
                    ]
                )
            ]
        ])
    })
    test('error', async () => {
        responseSequence([
            [
                500,
                () => {
                    return { msg: 'error' }
                }
            ]
        ])
        const dispatch = jest.fn()
        const entityGroupMap = new Map([[idEntity, [idEntity, idEntity1]]])
        const tagDefinitionList = [
            newColumnDefinition({
                namePath: ['tag def test'],
                idPersistent: idTagRequested,
                columnType: ColumnType.String,
                curated: false,

                version: 3
            })
        ]
        await new GetContributionTagInstancesAsyncAction({
            entitiesGroupMap: entityGroupMap,
            tagDefinitionList: tagDefinitionList,
            idContributionPersistent: 'id-contribution-test'
        }).run(dispatch)
        expect(dispatch.mock.calls).toEqual([
            [
                new GetContributionTagInstancesStartAction(
                    entityGroupMap,
                    tagDefinitionList
                )
            ],
            [
                new GetContributionTagInstancesErrorAction(
                    entityGroupMap,
                    tagDefinitionList,
                    'error'
                )
            ]
        ])
    })
})
