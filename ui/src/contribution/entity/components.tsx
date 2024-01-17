import { useLoaderData } from 'react-router-dom'
import { constructColumnTitle, mkCellContentCallback } from './hooks'
import { ContributionStepper } from '../components'
import { RemoteTriggerButton, VrAnLoading } from '../../util/components/misc'
import {
    Button,
    CloseButton,
    Col,
    ListGroup,
    Modal,
    Overlay,
    Popover,
    Row
} from 'react-bootstrap'
import {
    ForwardedRef,
    forwardRef,
    useCallback,
    useEffect,
    useRef,
    useState
} from 'react'
import { EntityWithDuplicates } from './state'
import { ColumnMenuBody } from '../../column_menu/components/menu'
import {
    DataEditor,
    GridMouseEventArgs,
    GridSelection
} from '@glideapps/glide-data-grid'
import { drawCell } from '../../table/draw'
import { useDispatch, useSelector } from 'react-redux'
import {
    selectEntityColumnDefs,
    selectCompleteEntityAssignment,
    selectEntities,
    selectEntitiesWithMatches,
    selectIsLoading,
    selectSelectedEntity,
    selectShowTagDefinitionsMenu,
    selectTagDefinitions,
    selectMatchTagDefinitionList,
    selectTagRowDefs
} from './selectors'
import {
    completeEntityAssignment,
    getContributionEntitiesAction,
    getContributionEntityDuplicateCandidatesAction,
    getContributionTagInstances,
    putDuplicateAction
} from './thunks'
import { AppDispatch } from '../../store'
import {
    completeEntityAssignmentClearError,
    incrementSelectedEntityIdx,
    setSelectedEntityIdx,
    toggleTagDefinitionMenu
} from './slice'
import { loadContributionDetails } from '../thunks'
import { selectContribution } from '../selectors'
import { clearSelectedContribution } from '../slice'
import { loadTagDefinitionHierarchy } from '../../column_menu/thunks'
import { ContributionStep } from '../state'
import { IBounds, useLayer } from 'react-laag'
import { TagDefinition } from '../../column_menu/state'

export function EntitiesStep() {
    const idContributionPersistent = useLoaderData() as string
    const dispatch: AppDispatch = useDispatch()
    const contributionCandidate = useSelector(selectContribution)
    useEffect(() => {
        dispatch(loadContributionDetails(idContributionPersistent))
        return function cleanup() {
            dispatch(clearSelectedContribution())
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idContributionPersistent])
    let body = <EntitiesStepBody idContributionPersistent={idContributionPersistent} />
    if (contributionCandidate.value === undefined) {
        body = <VrAnLoading />
    }
    return (
        <ContributionStepper
            selectedIdx={2}
            id_persistent={idContributionPersistent}
            step={contributionCandidate.value?.step ?? ContributionStep.ValuesExtracted}
        >
            {body}
        </ContributionStepper>
    )
}

export function EntitiesStepBody({
    idContributionPersistent
}: {
    idContributionPersistent: string
}) {
    const dispatch: AppDispatch = useDispatch()
    // const isLoadingTag = useSelector(selectTagSelectionLoading)
    useEffect(() => {
        dispatch(getContributionEntitiesAction(idContributionPersistent))
            .then(async (entities) => {
                dispatch(loadTagDefinitionHierarchy({}))
                return entities
            })
            .then(async (entities) => {
                await dispatch(
                    getContributionEntityDuplicateCandidatesAction({
                        idContributionPersistent,
                        entityIdPersistentList: entities.map(
                            (entity) => entity.idPersistent
                        )
                    })
                )
            })
    }, [dispatch, idContributionPersistent])
    const entities = useSelector(selectEntitiesWithMatches)
    const isLoading = useSelector(selectIsLoading)
    const putDuplicateCallback = (
        idEntityOriginPersistent: string,
        idEntityDestinationPersistent?: string
    ) => {
        dispatch(
            putDuplicateAction({
                idContributionPersistent,
                idEntityOriginPersistent,
                idEntityDestinationPersistent
            })
        ).then(() => dispatch(incrementSelectedEntityIdx()))
    }
    const containerRef = useRef(null)
    if (isLoading) {
        return <VrAnLoading />
    }
    return (
        <Row className="h-100 overflow-hidden" ref={containerRef}>
            <Col xs={3} className="h-100 overflow-hidden d-flex flex-column">
                <Row className="mb-2 justify-content-center">
                    <CompleteAssignmentButton
                        idContributionPersistent={idContributionPersistent}
                        ref={containerRef}
                    />
                </Row>
                <Row className="h-100 overflow-y-scroll">
                    <EntityConflictList entityConflicts={entities.value} />
                </Row>
            </Col>
            <Col className="h-100 overflow-hidden d-flex flex-column">
                <Row>
                    <Col key="entities-step-hint" className="ms-0">
                        Please check for duplicate entities. Select the first Row to
                        indicate that there is no duplicate.
                    </Col>
                    <Col sm="auto" key="entities-step-add-tag-button">
                        <Button onClick={() => dispatch(toggleTagDefinitionMenu())}>
                            Show Additional Tag Values
                        </Button>
                    </Col>
                </Row>
                <Row className="h-100 w-100 ms-2 mt-3">
                    <div id="portal">
                        <EntityConflictBody
                            putDuplicateCallback={putDuplicateCallback}
                            idContributionPersistent={idContributionPersistent}
                        />
                    </div>
                </Row>
            </Col>
        </Row>
    )
}

export function EntityConflictBody({
    idContributionPersistent,
    putDuplicateCallback
}: {
    idContributionPersistent: string
    putDuplicateCallback: (
        idEntityOriginPersistent: string,
        idEntityDestinationPersistent?: string
    ) => void
}) {
    const selectedEntity = useSelector(selectSelectedEntity)
    const [tagDefinitionList, tagDefinitionMap] = useSelector(selectTagDefinitions)
    const matchTags = useSelector(selectMatchTagDefinitionList)
    const dispatch: AppDispatch = useDispatch()
    useEffect(
        () => {
            if (selectedEntity === undefined) {
                return
            }
            const entityMap: { [key: string]: string[] } = {}
            entityMap[selectedEntity.idPersistent] = [
                selectedEntity.idPersistent,
                ...new Set(
                    selectedEntity.similarEntities.value.map(
                        (entity) => entity.idPersistent
                    )
                )
            ]
            dispatch(
                getContributionTagInstances({
                    idContributionPersistent: idContributionPersistent,
                    entitiesGroupMap: entityMap,
                    tagDefinitionList: [...matchTags, ...tagDefinitionList]
                })
            )
        },
        //eslint-disable-next-line react-hooks/exhaustive-deps
        [idContributionPersistent, selectedEntity?.idPersistent, matchTags]
    )
    let body = <span>Please select an entity</span>
    if (selectedEntity !== undefined) {
        if (selectedEntity.similarEntities.isLoading) {
            return <VrAnLoading />
        } else {
            body = (
                <EntitySimilarityItem
                    entity={selectedEntity}
                    putDuplicateCallback={putDuplicateCallback}
                    numMatchTags={matchTags.length}
                    numTags={tagDefinitionList.length}
                />
            )
        }
    }
    return (
        <>
            {body}
            <AddTagDefinitionsModal
                idContributionPersistent={idContributionPersistent}
                tagDefinitionMap={tagDefinitionMap}
            />
        </>
    )
}

function AddTagDefinitionsModal({
    idContributionPersistent,
    tagDefinitionMap
}: {
    idContributionPersistent: string
    tagDefinitionMap: Map<string, number>
}) {
    const dispatch: AppDispatch = useDispatch()
    const showTagDefinitionsMenu = useSelector(selectShowTagDefinitionsMenu)
    const entities = useSelector(selectEntities)
    return (
        <Modal
            show={showTagDefinitionsMenu}
            onHide={() => dispatch(toggleTagDefinitionMenu())}
            data-testid="create-column-modal"
            key="entities-step-modal"
        >
            <Modal.Header closeButton>
                <Modal.Title>Create a new tag</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <ColumnMenuBody
                    loadColumnDataCallback={(tagDef) => {
                        const chunkSize = 50
                        for (
                            let startIdx = 0;
                            startIdx < entities.value.length;
                            startIdx += chunkSize
                        ) {
                            if (entities.isLoading) {
                                return
                            }
                            const endIdx = Math.min(
                                entities.value.length,
                                startIdx + chunkSize
                            )
                            const entitiesSlice = entities.value.slice(startIdx, endIdx)
                            const entitiesMap: { [key: string]: string[] } = {}
                            for (const entity of entitiesSlice) {
                                if (entity.similarEntities.isLoading) {
                                    return
                                }
                                entitiesMap[entity.idPersistent] = [
                                    entity.idPersistent,
                                    ...new Set(
                                        entity.similarEntities.value.map(
                                            (entity) => entity.idPersistent
                                        )
                                    )
                                ]
                            }
                            dispatch(
                                getContributionTagInstances({
                                    entitiesGroupMap: entitiesMap,
                                    tagDefinitionList: [tagDef],
                                    idContributionPersistent: idContributionPersistent
                                })
                            )
                        }
                    }}
                    columnIndices={tagDefinitionMap}
                />
            </Modal.Body>
        </Modal>
    )
}

const zeroBounds = {
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    bottom: 0,
    right: 0
}

export function EntitySimilarityItem({
    entity,
    putDuplicateCallback,
    numMatchTags,
    numTags
}: {
    entity: EntityWithDuplicates
    putDuplicateCallback: (
        idEntityOriginPersistent: string,
        idEntityDestinationPersistent?: string
    ) => void
    numMatchTags: number
    numTags: number
}) {
    const entityColumnDefs = useSelector(selectEntityColumnDefs)
    const tagRowDefs = useSelector(selectTagRowDefs)
    const {
        similarEntities,
        displayTxt,
        displayTxtDetails: entityDisplayTxtDetails,
        idPersistent
    } = entity
    const [tooltip, setTooltip] = useState<
        { val: string; bounds: IBounds } | undefined
    >()
    const { layerProps: tooltipLayerProps, renderLayer: tooltipRenderLayer } = useLayer(
        {
            isOpen: tooltip !== undefined,
            triggerOffset: 4,
            auto: true,
            container: 'portal',
            trigger: {
                getBounds: () => tooltip?.bounds ?? zeroBounds
            }
        }
    )

    const timeoutRef = useRef(0)

    const onItemHovered = useCallback(
        (args: GridMouseEventArgs) => {
            const colIdx = args.location[0]
            if (args.kind === 'cell' && colIdx > 0 && args.location[1] == 3) {
                let displayTxtDetails = entityDisplayTxtDetails
                if (colIdx > 1) {
                    displayTxtDetails =
                        similarEntities.value[colIdx - 2].displayTxtDetails
                }
                window.clearTimeout(timeoutRef.current)
                setTooltip(undefined)
                let tooltipValue = ''
                if (typeof entityDisplayTxtDetails == 'string') {
                    tooltipValue = displayTxtDetails as string
                } else {
                    tooltipValue = constructColumnTitle(
                        (displayTxtDetails as TagDefinition).namePath
                    )
                }
                timeoutRef.current = window.setTimeout(() => {
                    setTooltip({
                        val: `Display text source: ${tooltipValue}`,
                        bounds: {
                            // translate to react-laag types
                            left: args.bounds.x,
                            top: args.bounds.y,
                            width: args.bounds.width,
                            height: args.bounds.height,
                            right: args.bounds.x + args.bounds.width,
                            bottom: args.bounds.y + args.bounds.height
                        }
                    })
                }, 1000)
            } else {
                window.clearTimeout(timeoutRef.current)
                timeoutRef.current = 0
                setTooltip(undefined)
            }
        },
        [similarEntities.value, entityDisplayTxtDetails]
    )
    if (similarEntities.errorMsg !== undefined) {
        return (
            <ListGroup.Item className="bg-danger" key={idPersistent}>
                <span key="span-0">{`Could not get duplicates for ${displayTxt}.\n`}</span>
                <span key="span-1">{`Reason: ${similarEntities.errorMsg}`}</span>
            </ListGroup.Item>
        )
    }
    if (similarEntities.value.length == 0) {
        return <></>
    }
    return (
        <div className="h-100 w-100 mb-2 ms-3 me-3" data-testid="table-container-outer">
            <div
                className="br-12 ps-0 pe-0 h-100 w-100 overflow-hidden"
                data-testid="table-container-inner"
            >
                <DataEditor
                    drawCell={drawCell}
                    rows={4 + numTags}
                    getCellContent={mkCellContentCallback(
                        entity,
                        tagRowDefs,
                        numMatchTags
                    )}
                    freezeColumns={2}
                    columns={entityColumnDefs}
                    rowSelect="none"
                    height="100%"
                    width="100%"
                    columnSelect="none"
                    rangeSelect="cell"
                    onGridSelectionChange={(selection: GridSelection) => {
                        const current = selection.current
                        if (current !== undefined) {
                            //Select range
                            const [colIdx, rowIdx] = current.cell
                            if (rowIdx != 0) {
                                return
                            }
                            if (colIdx === undefined || colIdx < 2) {
                                putDuplicateCallback(entity.idPersistent, undefined)
                            } else {
                                putDuplicateCallback(
                                    entity.idPersistent,
                                    entity.similarEntities.value[colIdx - 2]
                                        .idPersistent
                                )
                            }
                        }
                    }}
                    onItemHovered={onItemHovered}
                />
                {tooltip != undefined &&
                    tooltipRenderLayer(
                        <div
                            {...tooltipLayerProps}
                            style={{
                                ...tooltipLayerProps.style,
                                padding: '8px 12px',
                                color: 'white',
                                font: '500 13px Inter',
                                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                                borderRadius: 9
                            }}
                        >
                            {tooltip.val}
                        </div>
                    )}
            </div>
        </div>
    )
}

export const CompleteAssignmentButton = forwardRef(
    (
        { idContributionPersistent }: { idContributionPersistent: string },
        containerRef: ForwardedRef<HTMLElement>
    ) => {
        const buttonRef = useRef(null)
        const completeEntityAssignmentState = useSelector(
            selectCompleteEntityAssignment
        )
        const dispatch: AppDispatch = useDispatch()
        return (
            <>
                <Col sm="auto" ref={buttonRef} key="entities-step-complete-button">
                    <RemoteTriggerButton
                        normalLabel="Confirm Assigned Duplicates"
                        successLabel="Duplicates Successfully Assigned"
                        remoteState={completeEntityAssignmentState}
                        onClick={() =>
                            dispatch(completeEntityAssignment(idContributionPersistent))
                        }
                    />
                </Col>
                <Overlay
                    show={completeEntityAssignmentState?.errorMsg !== undefined}
                    target={buttonRef.current}
                    placement="bottom"
                    ref={containerRef}
                >
                    <Popover id="finalize-column-assignment-error-popover">
                        <Popover.Header className="bg-danger text-light">
                            <Row className="justify-content-between">
                                <Col>Error</Col>
                                <CloseButton
                                    variant="white"
                                    onClick={() =>
                                        dispatch(completeEntityAssignmentClearError())
                                    }
                                ></CloseButton>
                            </Row>
                        </Popover.Header>
                        <Popover.Body>
                            <span>{completeEntityAssignmentState?.errorMsg}</span>
                        </Popover.Body>
                    </Popover>
                </Overlay>
            </>
        )
    }
)

export function EntityConflictList({
    entityConflicts
}: {
    entityConflicts: EntityWithDuplicates[]
}) {
    const dispatch = useDispatch()
    const selectEntityCallback = (idx: number) => dispatch(setSelectedEntityIdx(idx))
    const selectedEntity = useSelector(selectSelectedEntity)
    if (entityConflicts.length == 0 || entityConflicts[0].similarEntities.isLoading) {
        return <VrAnLoading />
    }
    return (
        <ListGroup>
            {entityConflicts.map((entity, idx) => (
                <EntityConflictListItem
                    entity={entity}
                    active={entity == selectedEntity}
                    key={entity.idPersistent}
                    onClick={() => {
                        selectEntityCallback(idx)
                    }}
                />
            ))}
        </ListGroup>
    )
}

export function EntityConflictListItem({
    entity,
    active,
    onClick
}: {
    entity: EntityWithDuplicates
    active: boolean
    onClick: VoidFunction
}) {
    return (
        <ListGroup.Item active={active} onClick={onClick}>
            {entity.displayTxt}
        </ListGroup.Item>
    )
}
