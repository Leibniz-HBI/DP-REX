/**
 * @jest-environment jsdom
 */

import {
    RenderOptions,
    render,
    waitFor,
    screen,
    getByRole,
    within
} from '@testing-library/react'
import { TagSelectionState, newTagSelectionState } from '../state'
import { configureStore } from '@reduxjs/toolkit'
import { tagSelectionSlice } from '../slice'
import { PropsWithChildren } from 'react'
import { Provider } from 'react-redux'
import { ColumnMenu } from '../components/menu'
import userEvent from '@testing-library/user-event'
import { UserEvent } from '@testing-library/user-event/dist/types/setup/setup'
import {
    NotificationManager,
    NotificationType,
    notificationReducer
} from '../../util/notification/slice'
import { describe } from 'node:test'

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
    preloadedState?: {
        tagSelection: TagSelectionState
        notification: NotificationManager
    }
}

export function renderWithProviders(
    ui: React.ReactElement,
    fetchMock: jest.Mock,
    {
        preloadedState = {
            tagSelection: newTagSelectionState({}),
            notification: { notificationList: [], notificationMap: {} }
        },
        ...renderOptions
    }: ExtendedRenderOptions = {}
) {
    const store = configureStore({
        reducer: {
            tagSelection: tagSelectionSlice.reducer,
            notification: notificationReducer
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

const idTagDef0 = 'id-tag-test-0'
const nameTagDef0 = 'tag def 0'
const idTagDef1 = 'id-tag-test-1'
const nameTagDef1 = 'tag def 1'
const idTagDef2 = 'id-tag-test-2'
const nameTagDef2 = 'tag def 2'
const idTagDef00 = 'id-tag-def-0-0'
const nameTagDef00 = 'child def 0 0'
const idTagDef20 = 'id-tag-def-2-0'
const nameTagDef20 = 'child def 2 0'
const idTagDef21 = 'id-tag-def-2-1'
const nameTagDef21 = 'child def 2 1'
const idTagDef210 = 'id-tag-def-2-1-0'
const nameTagDef210 = 'grandchild def 2 1 0'
function initialResponseSequence(fetchMock: jest.Mock) {
    addResponseSequence(fetchMock, [
        [
            200,
            {
                tag_definitions: [
                    {
                        id_persistent: idTagDef0,
                        name_path: [nameTagDef0],
                        name: nameTagDef0,
                        curated: true,
                        version: 0,
                        type: 'STRING'
                    },
                    {
                        id_persistent: idTagDef1,
                        name_path: [nameTagDef1],
                        name: nameTagDef1,
                        curated: false,
                        version: 1,
                        type: 'STRING'
                    },
                    {
                        id_persistent: idTagDef2,
                        name_path: [nameTagDef2],
                        name: nameTagDef2,
                        curated: true,
                        version: 2,
                        type: 'STRING'
                    }
                ]
            }
        ],
        [
            200,
            {
                tag_definitions: [
                    {
                        id_persistent: idTagDef00,
                        name_path: [nameTagDef0, nameTagDef00],
                        name: nameTagDef00,
                        curated: true,
                        version: 10,
                        type: 'STRING'
                    }
                ]
            }
        ],
        [200, { tag_definitions: [] }],
        [
            200,
            {
                tag_definitions: [
                    {
                        id_persistent: idTagDef20,
                        namePath: [nameTagDef2, nameTagDef20],
                        name: nameTagDef20,
                        curated: true,
                        version: 20,
                        type: 'STRING'
                    },
                    {
                        id_persistent: idTagDef21,
                        name_path: [nameTagDef2, nameTagDef21],
                        name: nameTagDef21,
                        curated: false,
                        version: 21,
                        type: 'STRING'
                    }
                ]
            }
        ],
        [200, { tag_definitions: [] }],
        [200, { tag_definitions: [] }],
        [
            200,
            {
                tag_definitions: [
                    {
                        id_persistent: idTagDef210,
                        name_path: [nameTagDef2, nameTagDef21, nameTagDef210],
                        name: nameTagDef210,
                        curate: true,
                        version: 210,
                        type: 'STRING'
                    }
                ]
            }
        ],
        [200, { tag_definitions: [] }]
    ])
}
describe('get hierarchy', () => {
    test('get hierarchy expand collapse', async () => {
        const fetchMock = jest.fn()
        initialResponseSequence(fetchMock)
        renderWithProviders(
            <ColumnMenu columnIndices={new Map()} loadColumnDataCallback={jest.fn()} />,
            fetchMock
        )
        await waitInitialDataLoad()
        let expandIcon, collapseIcon
        await waitFor(() => {
            const withLabel0 = screen.getAllByText(nameTagDef0)
            expect(withLabel0.length).toEqual(2)
            const withLabel1 = screen.getAllByText(nameTagDef1)
            expect(withLabel1.length).toEqual(1)
            const withLabel2 = screen.getAllByText(nameTagDef2)
            expect(withLabel2.length).toEqual(3)
            expandIcon =
                withLabel2[2]?.parentElement?.parentElement?.children[0]?.children[1]

            expect(expandIcon?.children[0]?.children[0]?.getAttribute('d')).toEqual(
                'M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z'
            )
        })
        ;(expandIcon as HTMLElement | undefined)?.click()
        await waitFor(() => {
            const withLabel0 = screen.getAllByText(nameTagDef0)
            expect(withLabel0.length).toEqual(2)
            const withLabel1 = screen.getAllByText(nameTagDef1)
            expect(withLabel1.length).toEqual(1)
            const withLabel2 = screen.getAllByText(nameTagDef2)
            expect(withLabel2.length).toEqual(4)
            collapseIcon =
                withLabel2[2]?.parentElement?.parentElement?.children[0]?.children[1]

            expect(collapseIcon?.children[0]?.children[0]?.getAttribute('d')).toEqual(
                'M2 8a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 8Z'
            )
        })
        ;(collapseIcon as HTMLElement | undefined)?.click()
        await waitFor(() => {
            const withLabel0 = screen.getAllByText(nameTagDef0)
            expect(withLabel0.length).toEqual(2)
            const withLabel1 = screen.getAllByText(nameTagDef1)
            expect(withLabel1.length).toEqual(1)
            const withLabel2 = screen.getAllByText(nameTagDef2)
            expect(withLabel2.length).toEqual(3)
        })
        expect(fetchMock.mock.calls.length).toEqual(8)
    })
    test('dispatches error', async () => {
        const fetchMock = jest.fn()
        const errorMsg = 'Error while loading hierarchy'
        addResponseSequence(fetchMock, [[500, { msg: errorMsg }]])
        const { store } = renderWithProviders(
            <ColumnMenu columnIndices={new Map()} loadColumnDataCallback={jest.fn()} />,
            fetchMock
        )
        await waitFor(() => {
            const notifications = store.getState().notification.notificationList
            expect(notifications.length).toEqual(1)
            expect(notifications[0].type).toEqual(NotificationType.Error)
            expect(notifications[0].msg).toContain(errorMsg)
        })
    })
})

describe('create tag definition', () => {
    async function setNameAndType(user: UserEvent) {
        await waitInitialDataLoad()
        const createButton = screen.getByText('Create')
        createButton.click()
        await waitFor(() => {
            screen.getByText('Choose a column name:')
        })
        const textBox = screen.getAllByRole('textbox')[0]
        await user.type(textBox, 'new tag def')
        const stringLabel = screen.getByText('string')
        const stringRadio = getByRole(
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
            stringLabel.parentElement?.parentElement!,
            'radio'
        )
        // const stringRadio = radioButtons[1]
        await user.click(stringRadio)
        return user
    }
    test('no parent', async () => {
        const fetchMock = jest.fn()
        initialResponseSequence(fetchMock)
        addResponseSequence(fetchMock, [[200, {}]])
        initialResponseSequence(fetchMock)
        renderWithProviders(
            <ColumnMenu columnIndices={new Map()} loadColumnDataCallback={jest.fn()} />,
            fetchMock
        )
        const user = userEvent.setup()
        await setNameAndType(user)
        const button = screen.getByRole('button', { name: 'Create' })
        await user.click(button)
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        await waitFor(() => {
            expect(fetchMock.mock.calls.length).toEqual(17)
            expect(fetchMock.mock.calls[8]).toEqual([
                'http://127.0.0.1:8000/vran/api/tags/definitions',
                {
                    method: 'POST',
                    credentials: 'include',
                    body: JSON.stringify({
                        tag_definitions: [{ name: 'new tag def', type: 'STRING' }]
                    }),
                    headers: { 'Content-Type': 'application/json' }
                }
            ])
        })
    }, 7000)
    test('with parent', async () => {
        const fetchMock = jest.fn()
        initialResponseSequence(fetchMock)
        addResponseSequence(fetchMock, [[200, {}]])
        initialResponseSequence(fetchMock)
        renderWithProviders(
            <ColumnMenu columnIndices={new Map()} loadColumnDataCallback={jest.fn()} />,
            fetchMock
        )
        const user = userEvent.setup()
        await setNameAndType(user)
        const parentEntry = screen.getByRole('button', {
            name: nameTagDef1
        })
        const parentRadio = within(parentEntry).getByRole('radio')
        await user.click(parentRadio)
        const createButton = screen.getByRole('button', { name: 'Create' })
        await user.click(createButton)
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        await waitFor(() => {
            expect(fetchMock.mock.calls.length).toEqual(17)
            expect(fetchMock.mock.calls[8]).toEqual([
                'http://127.0.0.1:8000/vran/api/tags/definitions',
                {
                    method: 'POST',
                    credentials: 'include',
                    body: JSON.stringify({
                        tag_definitions: [
                            {
                                name: 'new tag def',
                                id_parent_persistent: idTagDef1,
                                type: 'STRING'
                            }
                        ]
                    }),
                    headers: { 'Content-Type': 'application/json' }
                }
            ])
        })
    }, 7000)
    test('dispatches error', async () => {
        const fetchMock = jest.fn()
        const errorMsg = 'Error while creating tag def'
        initialResponseSequence(fetchMock)
        addResponseSequence(fetchMock, [[500, { msg: errorMsg }]])
        const { store } = renderWithProviders(
            <ColumnMenu columnIndices={new Map()} loadColumnDataCallback={jest.fn()} />,
            fetchMock
        )
        const user = userEvent.setup()
        await setNameAndType(user)
        const button = screen.getByRole('button', { name: 'Create' })
        await user.click(button)
        await waitFor(() => {
            const notifications = store.getState().notification.notificationList
            expect(notifications.length).toEqual(1)
            expect(notifications[0].type).toEqual(NotificationType.Error)
            expect(notifications[0].msg).toContain(errorMsg)
        })
    }, 6000)
})
async function waitInitialDataLoad() {
    await waitFor(() => {
        const withLabel0 = screen.getAllByText(nameTagDef0)
        expect(withLabel0.length).toEqual(1)
        const withLabel1 = screen.getAllByText(nameTagDef1)
        expect(withLabel1.length).toEqual(1)
        const withLabel2 = screen.getAllByText(nameTagDef2)
        expect(withLabel2.length).toEqual(1)
    })
}
