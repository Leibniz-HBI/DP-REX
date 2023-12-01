/**
 * @jest-environment jsdom
 */
jest.mock('@glideapps/glide-data-grid', () => {
    const actual = jest.requireActual('@glideapps/glide-data-grid')
    return {
        __esmodule: true,
        DataEditor: jest
            .fn()
            .mockImplementation((props: object) => <MockTable {...props} />),
        CompactSelection: actual.CompactSelection
    }
})
import { RenderOptions, render, waitFor, screen } from '@testing-library/react'
import { ContributionEntityState, newContributionEntityState } from '../state'
import { RemoteInterface, newRemote } from '../../../util/state'
import { Contribution } from '../../state'
import { configureStore } from '@reduxjs/toolkit'
import { contributionEntitySlice } from '../slice'
import { contributionSlice } from '../../slice'
import { PropsWithChildren } from 'react'
import { Provider } from 'react-redux'
import { EntitiesStep } from '../components'
import { TagSelectionState, newTagSelectionState } from '../../../column_menu/state'
import { tagSelectionSlice } from '../../../column_menu/slice'
import { Button, Col, Row } from 'react-bootstrap'
import {
    CompactSelection,
    GridSelection,
    Item,
    Rectangle
} from '@glideapps/glide-data-grid'

jest.mock('react-router-dom', () => {
    const loaderMock = jest.fn()
    loaderMock.mockReturnValue('id-contribution-test')
    return { useLoaderData: loaderMock, useNavigate: jest.fn() }
})
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
function MockTable(props: any) {
    return (
        <div className="mock">
            <Col>
                {Array.from({ length: props.rows }, (_, idx: number) => idx).map(
                    (idxRow) => (
                        <Row>
                            {Array.from(
                                { length: props.columns.length },
                                (_, idx: number) => idx
                            ).map((idxCol) => {
                                const cell = props.getCellContent([idxCol, idxRow])
                                if (cell.kind == 'text') {
                                    return <Col>cell.displayData</Col>
                                } else if (cell.kind == 'custom') {
                                    const replaceInfo = cell.data
                                    const buttonText = replaceInfo.isNew
                                        ? 'Assign Duplicate'
                                        : 'Create New Entity'
                                    const selection: GridSelection = {
                                        current: {
                                            cell: [idxCol, idxRow] as Item,
                                            range: {
                                                x: idxCol,
                                                y: idxRow,
                                                width: 1,
                                                height: 1
                                            } as Rectangle,
                                            rangeStack: []
                                        },
                                        columns: CompactSelection.empty(),
                                        rows: CompactSelection.empty()
                                    }
                                    return (
                                        <Col>
                                            <Button
                                                onClick={() =>
                                                    props.onGridSelectionChange(
                                                        selection
                                                    )
                                                }
                                            >
                                                {buttonText}
                                            </Button>
                                        </Col>
                                    )
                                }
                                return <Col></Col>
                            })}
                        </Row>
                    )
                )}
            </Col>
        </div>
    )
}

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
    preloadedState?: {
        contributionEntity: ContributionEntityState
        contribution: {
            selectedContribution: RemoteInterface<Contribution | undefined>
        }
        tagSelection: TagSelectionState
    }
}

export function renderWithProviders(
    ui: React.ReactElement,
    fetchMock: jest.Mock,
    {
        preloadedState = {
            contributionEntity: newContributionEntityState({}),
            contribution: { selectedContribution: newRemote(undefined) },
            tagSelection: newTagSelectionState({})
        },
        ...renderOptions
    }: ExtendedRenderOptions = {}
) {
    const store = configureStore({
        reducer: {
            contributionEntity: contributionEntitySlice.reducer,
            contribution: contributionSlice.reducer,
            tagSelection: tagSelectionSlice.reducer
        },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({ thunk: { extraArgument: fetchMock } }),
        preloadedState
    })
    function Wrapper({ children }: PropsWithChildren<object>): JSX.Element {
        return <Provider store={store}>{children}</Provider>
    }

    // Return an object with the store and all of RTL's query functions
    return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) }
}
function addResponseSequence(mock: jest.Mock, responses: [number, unknown][]) {
    for (const tpl of responses) {
        const [status_code, rsp] = tpl
        mock.mockImplementationOnce(
            jest.fn(() =>
                Promise.resolve({
                    status: status_code,
                    json: () => Promise.resolve(rsp)
                })
            ) as jest.Mock
        )
    }
}
const idContribution = 'id-contribution-test'
const contributionTest = {
    id_persistent: idContribution,
    name: 'contribution test',
    description: 'A contribution used in tests',
    anonymous: false,
    has_header: true,
    state: 'VALUES_EXTRACTED',
    author: 'author-test'
}
const personList = Array.from({ length: 60 }, (_val, idx) => {
    return {
        display_txt: `entity-${idx}`,
        version: 0,
        id_persistent: `id-entity-${idx}`
    }
})
function mkMatches(
    entities: {
        id_persistent: string
        display_txt: string
        version: number
    }[]
) {
    return Object.fromEntries(
        entities.map((entity, idx) => [
            entity.id_persistent,
            {
                matches: [
                    {
                        similarity: idx / 100.0,
                        entity: {
                            display_txt: entity.display_txt + ` match 0`,
                            id_persistent: entity.id_persistent + '-0',
                            version: 0
                        }
                    },
                    {
                        similarity: idx / 100.0 + 0.001,
                        entity: {
                            display_txt: entity.display_txt + ` match 1`,
                            id_persistent: entity.id_persistent + '-1',
                            version: 0
                        }
                    }
                ],
                assignedDuplicate:
                    idx % 10 == 0
                        ? {
                              display_txt: entity.display_txt + ' match 1',
                              id_persistent: entity.id_persistent + '-1',
                              version: 0
                          }
                        : undefined
            }
        ])
    )
}
function initialResponses(fetchMock: jest.Mock) {
    addResponseSequence(fetchMock, [
        [200, { contributionTest }],
        [200, { persons: personList }],
        [200, { persons: [] }],
        [200, { tag_definitions: [] }],
        [200, { matches: mkMatches(personList.slice(0, 50)) }]
    ])
}

test('assign duplicate', async () => {
    const fetchMock = jest.fn()
    initialResponses(fetchMock), addResponseSequence(fetchMock, [[200, {}]])
    addResponseSequence(fetchMock, [
        [
            200,
            {
                assigned_duplicate: {
                    id_persistent: 'id-entity-0-1',
                    display_txt: 'entity-0 match 1',
                    version: 0
                }
            }
        ],
        [
            200,
            {
                assigned_duplicate: {
                    id_persistent: 'id-entity-1-0',
                    display_txt: 'entity-1 match 0',
                    version: 0
                }
            }
        ],
        [200, { assigned_duplicate: undefined }],
        [200, { assigned_duplicate: null }]
    ])
    const { store } = renderWithProviders(<EntitiesStep />, fetchMock)
    await waitFor(() => {
        expect(fetchMock.mock.calls.length).toEqual(6)
    })
    await waitFor(() => {
        const buttons = screen.getAllByRole('button', { name: /Assign Duplicate/i })
        expect(buttons.length).toEqual(100)
        buttons[1].click()
        buttons[2].click()
    })
    await waitFor(() => {
        const state = store.getState().contributionEntity
        expect(state.entities.value[0].assignedDuplicate).toEqual(
            newRemote({
                idPersistent: 'id-entity-0-1',
                displayTxt: 'entity-0 match 1',
                version: 0
            })
        )
        expect(state.entities.value[1].assignedDuplicate).toEqual(
            newRemote({
                idPersistent: 'id-entity-1-0',
                displayTxt: 'entity-1 match 0',
                version: 0
            })
        )
    })
    expect(fetchMock.mock.calls.at(-2)).toEqual([
        `http://127.0.0.1:8000/vran/api/contributions/${idContribution}/entities/id-entity-0/duplicate`,
        {
            body: JSON.stringify({ id_entity_destination_persistent: 'id-entity-0-1' }),
            credentials: 'include',
            method: 'PUT'
        }
    ])
    expect(fetchMock.mock.calls.at(-1)).toEqual([
        `http://127.0.0.1:8000/vran/api/contributions/${idContribution}/entities/id-entity-1/duplicate`,
        {
            body: JSON.stringify({ id_entity_destination_persistent: 'id-entity-1-0' }),
            credentials: 'include',
            method: 'PUT'
        }
    ])
    await waitFor(() => {
        const buttons = screen.getAllByRole('button', { name: /Create New Entity/i })
        expect(buttons.length).toEqual(50)
        buttons[0].click()
        buttons[1].click()
    })
    await waitFor(() => {
        const state = store.getState().contributionEntity
        expect(state.entities.value[0].assignedDuplicate).toEqual(newRemote(undefined))
        expect(state.entities.value[1].assignedDuplicate).toEqual(newRemote(undefined))
    })
    expect(fetchMock.mock.calls.at(-2)).toEqual([
        `http://127.0.0.1:8000/vran/api/contributions/${idContribution}/entities/id-entity-0/duplicate`,
        {
            body: JSON.stringify({}),
            credentials: 'include',
            method: 'PUT'
        }
    ])
    expect(fetchMock.mock.calls.at(-1)).toEqual([
        `http://127.0.0.1:8000/vran/api/contributions/${idContribution}/entities/id-entity-1/duplicate`,
        {
            body: JSON.stringify({}),
            credentials: 'include',
            method: 'PUT'
        }
    ])
})
