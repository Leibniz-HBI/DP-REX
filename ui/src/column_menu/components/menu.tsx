import { useEffect, useState } from 'react'
import { Col, Form, Row } from 'react-bootstrap'
import { TagDefinition } from '../state'
import { ColumnTypeCreateForm, ColumnTypeCreateFormProps } from './form'
import { ColumnSelector } from './selection'
import { Eye, EyeFill } from 'react-bootstrap-icons'
import { VrAnLoading } from '../../util/components/misc'
import { useDispatch, useSelector } from 'react-redux'
import { selectTagSelectionLoading } from '../selectors'
import { loadTagDefinitionHierarchy } from '../thunks'
import { AppDispatch } from '../../store'

export function ColumnMenu(props: {
    columnIndices: Map<string, number>
    loadColumnDataCallback: (columnDefinition: TagDefinition) => void
}) {
    const isLoading = useSelector(selectTagSelectionLoading)
    const dispatch: AppDispatch = useDispatch()
    useEffect(
        () => {
            if (!isLoading) {
                dispatch(loadTagDefinitionHierarchy({ expand: true }))
            }
        },
        //eslint-disable-next-line
        [dispatch]
    )
    return (
        <ColumnMenuBody
            columnIndices={props.columnIndices}
            loadColumnDataCallback={props.loadColumnDataCallback}
        />
    )
}

export function ColumnMenuBody({
    columnIndices,
    loadColumnDataCallback
}: {
    columnIndices: Map<string, number>
    loadColumnDataCallback: (columnDefinition: TagDefinition) => void
}) {
    const isLoading = useSelector(selectTagSelectionLoading)
    let showLinkClass = 'nav-link'
    let createLinkClass = 'nav-link'
    const [createTabSelected, setCreateTabSelected] = useState(false)
    let body = <VrAnLoading />

    if (!isLoading) {
        if (createTabSelected) {
            createLinkClass += ' active bg-light'
            body = (
                <CreateTabBody
                    additionalEntries={[{ idPersistent: '', name: 'No parent' }]}
                />
            )
        } else {
            showLinkClass += ' active bg-light'
            body = (
                <ShowTabBody
                    columnIndices={columnIndices}
                    loadColumnDataCallback={loadColumnDataCallback}
                />
            )
        }
    }
    const tabs = [
        <li
            className="nav-item "
            key="select-tab-label"
            onClick={() => {
                setCreateTabSelected(false)
            }}
        >
            <a className={showLinkClass}>Load</a>
        </li>,
        <li
            className="nav-item "
            key="create-tab-label"
            onClick={() => {
                setCreateTabSelected(true)
            }}
        >
            <a className={createLinkClass}>Create</a>
        </li>
    ]
    return (
        <div className="container text-left bg-light rounded ps-0 pe-0 h-100 overflow-y-hidden">
            <Col className="h-100 d-flex flex-column overflow-hidden flex-grow-1 flex-shrink-1">
                <Row className="ms-0 me-0">
                    <ul className="nav nav-tabs justify-content-center ">{tabs}</ul>
                </Row>
                {body}
            </Col>
        </div>
    )
}
function CreateTabBody({
    additionalEntries
}: {
    additionalEntries: { idPersistent: string; name: string }[]
}) {
    return (
        <div className="ps-2 pe-2 d-flex flex-column overflow-hidden flex-grow-1 flex-shrink-1">
            <ColumnTypeCreateForm>
                {(columnTypeCreateFormProps: ColumnTypeCreateFormProps) => (
                    <ColumnSelector
                        additionalEntries={additionalEntries}
                        mkTailElement={(columnDefinition: TagDefinition) => (
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
                        )}
                    />
                )}
            </ColumnTypeCreateForm>
        </div>
    )
}

function ShowTabBody({
    columnIndices,
    loadColumnDataCallback
}: {
    columnIndices: Map<string, number>
    loadColumnDataCallback: (columnDefinition: TagDefinition) => void
}) {
    return (
        <ColumnSelector
            mkTailElement={(columnDefinition: TagDefinition) => {
                const isDisplayedInTable = columnIndices.has(
                    columnDefinition.idPersistent
                )
                if (isDisplayedInTable) {
                    return (
                        <span className="icon">
                            <EyeFill height={20} />
                        </span>
                    )
                } else {
                    return (
                        <span
                            className="icon"
                            onClick={() => loadColumnDataCallback(columnDefinition)}
                        >
                            <Eye height={20} />
                        </span>
                    )
                }
            }}
        />
    )
}
