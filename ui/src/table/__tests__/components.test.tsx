/**
 * @jest-environment jsdom
 */
/* eslint-disable @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars */
jest.mock('@glideapps/glide-data-grid', () => ({
    __esmodule: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    DataEditor: jest.fn().mockImplementation((props: any) => <MockTable />)
}))
import { describe } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { DataTable } from '../components'
import { ColumnState, newEntity } from '../state'
import {
    DataEditor,
    GridCell,
    GridCellKind,
    GridColumn,
    Item
} from '@glideapps/glide-data-grid'
import { TagDefinition, TagType } from '../../column_menu/state'
import { LocalTableCallbacks, TableDataProps } from '../hooks'
import { ColumnAddButton } from '../../column_menu/components/misc'
import { newNotification } from '../../util/notification/slice'
import { Remote } from '../../util/state'
jest.mock('react-redux', () => {
    return {
        // eslint-disable-next-line
        useSelector: (_selector: any) => [],
        useDispatch: jest.fn()
    }
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
function MockTable(props: any) {
    return <div className="mock"></div>
}
const testColumns = [
    new ColumnState({
        tagDefinition: {
            idPersistent: 'test_column_0',
            namePath: ['test title 0'],
            columnType: TagType.String,
            curated: false,
            hidden: false,
            version: 0
        },
        cellContents: new Remote([])
    }),
    new ColumnState({
        tagDefinition: {
            idPersistent: 'test_column_1',
            namePath: ['test title 1'],
            columnType: TagType.String,
            curated: false,
            hidden: false,
            version: 0
        },
        cellContents: new Remote([])
    })
]

describe('table from state', () => {
    const baseTableProps: TableDataProps = {
        entities: [],
        columnStates: [],
        columnIndices: new Map(),
        isLoading: false,
        frozenColumns: 1,
        isShowColumnAddMenu: false,
        selectedColumnHeaderBounds: undefined,
        columnHeaderMenuEntries: [],
        showEntityAddMenu: false,
        showEntityMergingModal: false,
        tagDefinitionChangeOwnership: undefined,
        entityAddState: new Remote(false),
        showSearch: false
    }
    const baseTableCallbacks: LocalTableCallbacks = {
        addColumnCallback: (columnDefinition: TagDefinition) => {},
        cellContentCallback: (cell: Item) => {
            return {
                kind: 'text' as GridCellKind,
                allowOverlay: false,
                displayData: '',
                data: ''
            } as GridCell
        },
        hideEntityMergingModalCallback: () => {},
        showEntityMergingModalCallback: () => {},
        showColumnAddMenuCallback: () => {},
        hideColumnAddMenuCallback: () => {},
        updateTagDefinitionCallback: () => {},
        showHeaderMenuCallback(columnIdx, bounds) {},
        hideHeaderMenuCallback: () => {},
        toggleSearchCallback: () => {},
        columnHeaderBoundsCallback: () => {
            return { left: 0, right: 0, top: 0, bottom: 0, height: 0, width: 0 }
        },
        removeColumnCallback: () => {},
        setColumnWidthCallback: (
            column: GridColumn,
            newSize: number,
            colIndex: number,
            newSizeWithGrow: number
        ) => {},
        switchColumnsCallback: (startIndex, endIndex) => {},
        hideTagDefinitionOwnershipCallback: () => {},
        showEntityAddMenuCallback: () => {},
        hideEntityAddMenuCallback: () => {},
        csvLines: () => []
    }
    test('should show loading with loading set', () => {
        const tableProps = { ...baseTableProps, isLoading: true }
        const { container } = render(
            <DataTable
                tableProps={tableProps}
                tableCallbacks={baseTableCallbacks}
                submitValueCallback={jest.fn()}
            />
        )
        const shimmers = container.getElementsByClassName('shimmer')
        expect(shimmers.length).toBe(1)
    })
    test('calls table editor', () => {
        const props = {
            ...baseTableProps,
            columnStates: testColumns,
            entities: [
                newEntity({
                    idPersistent: 'id-entity-test-0',
                    displayTxt: 'display text test 0',
                    version: 300,
                    disabled: false
                }),
                newEntity({
                    idPersistent: 'id-entity-test-1',
                    displayTxt: 'display text test 1',
                    version: 301,
                    disabled: false
                }),
                newEntity({
                    idPersistent: 'id-entity-test-3',
                    displayTxt: 'display text test 3',
                    version: 303,
                    disabled: false
                })
            ],
            isLoading: false
        }
        const { container } = render(
            <DataTable
                tableProps={props}
                tableCallbacks={baseTableCallbacks}
                submitValueCallback={jest.fn()}
            />
        )
        const mock = container.getElementsByClassName('mock')
        expect(mock.length).toBe(1)
        expect(`${(DataEditor as unknown as jest.Mock).mock.calls[0][0]}`).toEqual(
            `${{
                rows: 3,
                width: '100%',
                height: '100%',
                getCellContent: baseTableCallbacks.cellContentCallback,
                freezeColumns: 1,
                onHeaderMenuClick: baseTableCallbacks.showHeaderMenuCallback,
                rightElement: (
                    <ColumnAddButton>
                        <button onClick={baseTableCallbacks.showColumnAddMenuCallback}>
                            +
                        </button>
                    </ColumnAddButton>
                ),
                rightElementProps: {
                    fill: false,
                    sticky: true
                },
                columns: [
                    {
                        title: 'test title 0',
                        id: 'test_column_0',
                        width: 200,
                        hasMenu: false
                    },
                    {
                        title: 'test title 1',
                        id: 'test_column_1',
                        width: 200,
                        hasMenu: true
                    }
                ]
            }}`
        )
    })
})
