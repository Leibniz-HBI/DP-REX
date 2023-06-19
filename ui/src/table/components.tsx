import {
    DataEditor,
    EditableGridCell,
    GridColumn,
    Item
} from '@glideapps/glide-data-grid'
import { useCallback, useLayoutEffect } from 'react'
import { Button, Row, Toast, ToastContainer } from 'react-bootstrap'
import { useLayer } from 'react-laag'
import { ColumnMenu } from '../column_menu/components/menu'
import { ColumnAddButton } from '../column_menu/components/misc'
import { HeaderMenu } from '../header_menu'
import { useRemoteTableData, LocalTableCallbacks, TableDataProps } from './hooks'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function RemoteDataTable(props: any) {
    const [remoteCallbacks, localCallbacks, syncInfo] = useRemoteTableData(
        props.column_defs
    )
    useLayoutEffect(
        () => {
            remoteCallbacks.loadTableDataCallback()
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [props.column_defs, syncInfo.isLoading]
    )

    return (
        <>
            <DataTable
                tableProps={syncInfo}
                tableCallbacks={{
                    ...localCallbacks,
                    // eslint-disable-next-line react-hooks/exhaustive-deps
                    cellContentCallback: useCallback(
                        localCallbacks.cellContentCallback,
                        [syncInfo.entities, syncInfo.columnStates]
                    )
                }}
                submitValueCallback={remoteCallbacks.submitValueCallback}
            />
            <div id="portal" />
        </>
    )
}

export function DataTable(props: {
    tableProps: TableDataProps
    tableCallbacks: LocalTableCallbacks
    submitValueCallback: (cell: Item, newValues: EditableGridCell) => void
}) {
    const {
        entities,
        columnStates,
        columnIndices,
        frozenColumns,
        selectedColumnHeaderBounds,
        isShowColumnAddMenu,
        isLoading,
        loadDataErrorState,
        submitValuesErrorState
    } = props.tableProps
    const {
        cellContentCallback,
        addColumnCallback,
        removeColumnCallback,
        showColumnAddMenuCallback,
        hideColumnAddMenuCallback,
        showHeaderMenuCallback,
        hideHeaderMenuCallback,
        setColumnWidthCallback,
        switchColumnsCallback,
        columnHeaderBoundsCallback,
        clearSubmitValueErrorCallback
    } = props.tableCallbacks
    const {
        layerProps: columnAddMenuLayerProps,
        triggerProps: columnAddMenuTriggerProps,
        renderLayer: columnAddMenuRenderLayer
    } = useLayer({
        isOpen: isShowColumnAddMenu,
        placement: 'bottom-end',
        onOutsideClick: hideColumnAddMenuCallback
    })
    const headerMenuOpen = selectedColumnHeaderBounds !== undefined
    const { layerProps, renderLayer } = useLayer({
        isOpen: headerMenuOpen,
        auto: true,
        placement: 'bottom-end',
        onOutsideClick: undefined,
        trigger: {
            getBounds: columnHeaderBoundsCallback
        }
    })

    if (isLoading || entities === undefined) {
        return (
            <div className="vran-table-container-outer">
                <div className="vran-table-container-inner">
                    <div className="shimmer"></div>
                </div>
            </div>
        )
    } else if (!(loadDataErrorState === undefined)) {
        return (
            <div>
                <p>Error: {loadDataErrorState.msg}</p>
            </div>
        )
    } else {
        const columnDefs: GridColumn[] = []
        for (let i = 0; i < columnStates.length; ++i) {
            const columnState = columnStates[i]
            columnDefs.push({
                id: columnState.idPersistent,
                title: columnState.name,
                width: columnState.width,
                hasMenu: i >= frozenColumns
            })
        }

        return (
            <div className="vran-table-container-outer">
                <div className="vran-table-container-inner">
                    <>
                        <DataEditor
                            rows={entities.length}
                            columns={columnDefs}
                            getCellContent={cellContentCallback}
                            width="100%"
                            height="100%"
                            freezeColumns={frozenColumns}
                            rightElement={
                                <ColumnAddButton>
                                    <button
                                        {...columnAddMenuTriggerProps}
                                        onClick={showColumnAddMenuCallback}
                                    >
                                        +
                                    </button>
                                </ColumnAddButton>
                            }
                            rightElementProps={{
                                fill: false,
                                sticky: true
                            }}
                            onHeaderMenuClick={showHeaderMenuCallback}
                            onColumnResize={setColumnWidthCallback}
                            onColumnMoved={switchColumnsCallback}
                            onCellEdited={props.submitValueCallback}
                        />
                        {isShowColumnAddMenu &&
                            columnAddMenuRenderLayer(
                                <div {...columnAddMenuLayerProps}>
                                    <ColumnMenu
                                        columnIndices={columnIndices}
                                        loadColumnDataCallback={addColumnCallback}
                                    />
                                </div>
                            )}
                        {headerMenuOpen &&
                            renderLayer(
                                <div {...layerProps}>
                                    <HeaderMenu
                                        closeHeaderMenuCallback={hideHeaderMenuCallback}
                                        removeColumnCallback={removeColumnCallback}
                                    />
                                </div>
                            )}
                    </>
                    {!!submitValuesErrorState && (
                        <ToastContainer position="bottom-end" className="p-3">
                            <Toast onClose={clearSubmitValueErrorCallback}>
                                <Toast.Header
                                    className="bg-danger"
                                    closeVariant="white"
                                >
                                    <strong className="me-auto">Error</strong>
                                </Toast.Header>
                                <Toast.Body>
                                    <Row>{submitValuesErrorState.msg}</Row>
                                    {!!submitValuesErrorState.retryCallback && (
                                        <div className="d-flex justify-content-end">
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={
                                                    submitValuesErrorState.retryCallback
                                                }
                                            >
                                                Retry
                                            </Button>
                                        </div>
                                    )}
                                </Toast.Body>
                            </Toast>
                        </ToastContainer>
                    )}
                </div>
            </div>
        )
    }
}
