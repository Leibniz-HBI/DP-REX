import { useLoaderData } from 'react-router-dom'
import { ContributionStepper } from '../components'
import {
    Button,
    CloseButton,
    Col,
    Form,
    FormCheck,
    ListGroup,
    Modal,
    Overlay,
    Popover,
    Row
} from 'react-bootstrap'
import { ColumnDefinitionContribution } from './state'
import { ChangeEvent, ForwardedRef, forwardRef, useLayoutEffect, useRef } from 'react'
import { ColumnSelector, mkListItems } from '../../column_menu/components/selection'
import { RemoteTriggerButton, VrAnLoading } from '../../util/components/misc'
import { TagDefinition } from '../../column_menu/state'
import {
    ColumnTypeCreateForm,
    ColumnTypeCreateFormProps
} from '../../column_menu/components/form'
import { useDispatch, useSelector } from 'react-redux'
import {
    finalizeColumnAssignment,
    loadColumnDefinitionsContribution,
    patchColumnDefinitionContribution
} from './thunks'
import { AppDispatch } from '../../store'
import {
    columnDefinitionContributionSelect,
    finalizeColumnAssignmentClearError,
    setColumnDefinitionFormTab
} from './slice'
import {
    selectColumnDefinitionsContributionTriple,
    selectCreateTabSelected,
    selectFinalizeColumnAssignment,
    selectSelectedColumnDefinition
} from './selectors'
import {
    selectNavigationEntries,
    selectTagSelectionLoading
} from '../../column_menu/selectors'
import { toggleExpansion } from '../../column_menu/slice'
import { loadTagDefinitionHierarchy } from '../../column_menu/thunks'
import { RemoteInterface } from '../../util/state'
import { selectContribution } from '../selectors'
import { loadContributionDetails } from '../thunks'

export function ColumnDefinitionStep() {
    const idContributionPersistent = useLoaderData() as string
    const listViewContainerRef = useRef(null)
    const dispatch: AppDispatch = useDispatch()
    const definitions = useSelector(selectColumnDefinitionsContributionTriple)
    const selectedColumnDefinition = useSelector(selectSelectedColumnDefinition)
    const createTabSelected = useSelector(selectCreateTabSelected)
    const isLoadingTags = useSelector(selectTagSelectionLoading)
    const contributionCandidate = useSelector(selectContribution)
    useLayoutEffect(() => {
        dispatch(loadContributionDetails(idContributionPersistent))
            .then(() => {
                dispatch(loadColumnDefinitionsContribution(idContributionPersistent))
            })
            .then(async () => {
                if (!isLoadingTags) {
                    await dispatch(loadTagDefinitionHierarchy({ expand: true }))
                }
            })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idContributionPersistent])
    if (
        definitions.isLoading ||
        contributionCandidate.isLoading ||
        contributionCandidate.value === undefined
    ) {
        return <VrAnLoading />
    }
    return (
        <ContributionStepper
            selectedIdx={1}
            id_persistent={idContributionPersistent}
            step={contributionCandidate.value.step}
        >
            <Row className="overflow-hidden h-100">
                <Col
                    xs={3}
                    className="h-100 overflow-hidden d-flex flex-column flex-grow-0"
                    key="column-definition-selection"
                    ref={listViewContainerRef}
                >
                    <Row className="align-self-center d-block">
                        <CompleteColumnAssignmentButton
                            idContributionPersistent={idContributionPersistent}
                            ref={listViewContainerRef}
                        />
                    </Row>
                    <Row className="text-primary">
                        <span>Columns extracted from upload:</span>
                    </Row>
                    <Row className="flex-grow-1 overflow-y-scroll">
                        <ListGroup>
                            {definitions.value?.activeDefinitionsList.map((colDef) => (
                                <ColumnDefinitionStepListItem
                                    columnDefinition={colDef}
                                    selected={colDef == selectedColumnDefinition.value}
                                    idContributionPersistent={idContributionPersistent}
                                    key={colDef.idPersistent}
                                />
                            ))}
                            {definitions.value?.discardedDefinitionsList.map(
                                (colDef) => (
                                    <ColumnDefinitionStepListItem
                                        columnDefinition={colDef}
                                        selected={
                                            colDef == selectedColumnDefinition.value
                                        }
                                        idContributionPersistent={
                                            idContributionPersistent
                                        }
                                        key={
                                            colDef.idPersistent +
                                            colDef.discard.toString()
                                        }
                                    />
                                )
                            )}
                        </ListGroup>
                    </Row>
                </Col>
                <Col
                    key="column-definition-assignment-form"
                    className="ps-1 pe-1 h-100"
                    data-testid="column-assignment-form-column"
                >
                    <ContributionColumnAssignmentForm
                        columnDefinition={selectedColumnDefinition.value}
                        createTabSelected={createTabSelected}
                        idContributionPersistent={idContributionPersistent}
                    />
                </Col>
            </Row>
        </ContributionStepper>
    )
}

export function ColumnDefinitionStepListItem({
    columnDefinition,
    selected,
    idContributionPersistent
}: {
    columnDefinition: ColumnDefinitionContribution
    selected: boolean
    idContributionPersistent: string
}) {
    const dispatch: AppDispatch = useDispatch()
    let itemClassName = ''

    if (selected) {
        itemClassName = 'bg-primary-subtle text-black'
    }
    return (
        <ListGroup.Item
            active={selected}
            onClick={() =>
                dispatch(columnDefinitionContributionSelect(columnDefinition))
            }
            className={itemClassName}
        >
            <Row>
                <Col sm={9} key="column-heading">
                    <Row key="index-in-file">Column {columnDefinition.indexInFile}</Row>
                    <Row key="column-name">
                        <span className="d-inline-block text-truncate">
                            {columnDefinition.name}
                        </span>
                    </Row>
                </Col>
                <Col xs={2} className="align-self-center">
                    <span>Import</span>
                    <FormCheck
                        className="ms-2"
                        type="switch"
                        // value={columnDefinition.idPersistent}
                        checked={!columnDefinition.discard}
                        onChange={(evt) => {
                            evt.stopPropagation()
                            dispatch(
                                patchColumnDefinitionContribution({
                                    idContributionPersistent,
                                    idPersistent: columnDefinition.idPersistent,
                                    discard: !columnDefinition.discard
                                })
                            )
                        }}
                    />
                </Col>
            </Row>
        </ListGroup.Item>
    )
}

export function ContributionColumnAssignmentForm({
    columnDefinition,
    createTabSelected,
    idContributionPersistent
}: {
    columnDefinition?: ColumnDefinitionContribution
    createTabSelected: boolean
    idContributionPersistent: string
}) {
    const dispatch: AppDispatch = useDispatch()
    if (columnDefinition === undefined) {
        return <span>Please select a column definition.</span>
    }

    return (
        <Row className="h-100 d-flex flex-row">
            <div
                data-testid="existing-column-form"
                className="h-100 d-flex flex-column mb-2 col-6"
            >
                <div className="ps-2 flex-grow-0 flex-shrink-0 d-block">
                    <span key="hint-note">
                        Please select the tag that should receive the data of column "
                    </span>
                    <span key="hint-column-definition">{columnDefinition.name}":</span>
                </div>
                <Row className="ms-3 me-3 flex-grow-0 flex-shrink-0 flex-nowrap order-2">
                    <Button
                        onClick={() => dispatch(setColumnDefinitionFormTab(true))}
                        variant="outline-primary"
                    >
                        Create new tag
                    </Button>
                </Row>
                {createTabSelected ? (
                    <div />
                ) : (
                    <ExistingColumnForm
                        columnDefinitionContribution={columnDefinition}
                        key={columnDefinition.idPersistent}
                        idContributionPersistent={idContributionPersistent}
                    />
                )}
            </div>
            <Col xs="6">Preview not implemented yet</Col>
            <Modal
                show={createTabSelected}
                onHide={() => dispatch(setColumnDefinitionFormTab(false))}
                data-testid="create-column-modal"
                size="lg"
                className="overflow-hidden"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Create a new tag</Modal.Title>
                </Modal.Header>
                <Modal.Body className="bg-secondary vh-85">
                    <NewColumnModalBody />
                </Modal.Body>
            </Modal>
        </Row>
    )
}

export function ExistingColumnForm({
    columnDefinitionContribution,
    idContributionPersistent
}: {
    columnDefinitionContribution: ColumnDefinitionContribution
    idContributionPersistent: string
}) {
    const dispatch: AppDispatch = useDispatch()
    const tagIsLoading = useSelector(selectTagSelectionLoading)
    const navigationEntries = useSelector(selectNavigationEntries)
    return (
        <div className="ps-1 pe-1 flex-column d-flex flex-grow-1 overflow-hidden">
            {tagIsLoading ? (
                <VrAnLoading />
            ) : (
                <ColumnSelector
                    listEntries={mkListItems({
                        columnSelectionEntries: navigationEntries,
                        path: [],
                        level: 0,
                        additionalEntries: [
                            {
                                idPersistent: 'id_persistent',
                                name: 'Persistent Entity Id'
                            },
                            {
                                idPersistent: 'display_txt',
                                name: 'Display Text'
                            }
                        ],
                        toggleExpansionCallback: (path) =>
                            dispatch(toggleExpansion(path)),
                        mkTailElement: (columnDefinitionExisting) => (
                            <Form.Check
                                type="radio"
                                name="idExisting"
                                value={columnDefinitionExisting?.idPersistent}
                                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                    dispatch(
                                        patchColumnDefinitionContribution({
                                            idPersistent:
                                                columnDefinitionContribution.idPersistent,
                                            idContributionPersistent,
                                            idExistingPersistent: event.target.value
                                        })
                                    )
                                }
                                checked={
                                    columnDefinitionContribution.idExistingPersistent ==
                                    columnDefinitionExisting?.idPersistent
                                }
                            />
                        )
                    })}
                />
            )}
        </div>
    )
}

export function NewColumnModalBody() {
    const isLoading = useSelector(selectTagSelectionLoading)
    const navigationEntries = useSelector(selectNavigationEntries)
    const dispatch = useDispatch()
    const additionalEntries = [{ idPersistent: '', name: 'No parent' }]
    if (isLoading) {
        return <VrAnLoading />
    }
    return (
        <ColumnTypeCreateForm>
            {(columnTypeCreateFormProps: ColumnTypeCreateFormProps) => (
                <ColumnSelector
                    listEntries={mkListItems({
                        columnSelectionEntries: navigationEntries,
                        path: [],
                        toggleExpansionCallback: (path) =>
                            dispatch(toggleExpansion(path)),
                        level: 0,
                        additionalEntries: additionalEntries,
                        mkTailElement: (columnDefinition: TagDefinition) => (
                            <Form.Check
                                type="radio"
                                name="parent"
                                value={columnDefinition.idPersistent}
                                onChange={columnTypeCreateFormProps.handleChange}
                                checked={
                                    columnTypeCreateFormProps.selectedParent ==
                                    columnDefinition.idPersistent
                                }
                            />
                        )
                    })}
                />
            )}
        </ColumnTypeCreateForm>
    )
}

export const CompleteColumnAssignmentButton = forwardRef(
    (
        { idContributionPersistent }: { idContributionPersistent: string },
        containerRef: ForwardedRef<HTMLElement>
    ) => {
        const dispatch: AppDispatch = useDispatch()
        const finalizeColumnAssignmentState = useSelector(
            selectFinalizeColumnAssignment
        )
        const buttonRef = useRef(null)
        return (
            <>
                <CompleteColumnAssignmentButtonInner
                    onClick={() =>
                        dispatch(finalizeColumnAssignment(idContributionPersistent))
                    }
                    finalizeColumnAssignmentState={finalizeColumnAssignmentState}
                    ref={buttonRef}
                />
                <Overlay
                    show={finalizeColumnAssignmentState?.errorMsg !== undefined}
                    target={buttonRef.current}
                    ref={containerRef}
                    placement="bottom"
                >
                    <Popover id="finalize-column-assignment-error-popover">
                        <Popover.Header className="bg-danger text-light">
                            <Row className="justify-content-between">
                                <Col>Error</Col>
                                <CloseButton
                                    variant="white"
                                    onClick={() =>
                                        dispatch(finalizeColumnAssignmentClearError())
                                    }
                                ></CloseButton>
                            </Row>
                        </Popover.Header>
                        <Popover.Body>
                            <span>{finalizeColumnAssignmentState?.errorMsg}</span>
                        </Popover.Body>
                    </Popover>
                </Overlay>
            </>
        )
    }
)
const CompleteColumnAssignmentButtonInner = forwardRef(
    (
        {
            onClick,
            finalizeColumnAssignmentState
        }: {
            onClick: () => void
            finalizeColumnAssignmentState: RemoteInterface<boolean>
        },
        ref: ForwardedRef<HTMLDivElement>
    ) => {
        return (
            <div ref={ref}>
                <RemoteTriggerButton
                    successLabel="Column assignment successfully finalized"
                    normalLabel="Finalize Column Assignment"
                    remoteState={finalizeColumnAssignmentState}
                    onClick={onClick}
                />
            </div>
        )
    }
)
