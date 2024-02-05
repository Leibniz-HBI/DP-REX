/**
 * @jest-environment jsdom
 */

import { RenderOptions, render, waitFor, screen } from '@testing-library/react'
import {
    NotificationManager,
    NotificationType,
    notificationReducer
} from '../../util/notification/slice'
import { ContributionState, contributionSlice, newContributionState } from '../slice'
import { configureStore } from '@reduxjs/toolkit'
import { PropsWithChildren } from 'react'
import { Provider } from 'react-redux'
import { ContributionList } from '../components'
import { newRemote } from '../../util/state'
import { ContributionStep, newContribution } from '../state'
import { useNavigate } from 'react-router-dom'

jest.mock('react-router-dom', () => {
    const mockNavigate = jest.fn()
    return {
        useNavigate: jest.fn().mockReturnValue(mockNavigate)
    }
})

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
    preloadedState?: {
        contribution: ContributionState
        notification: NotificationManager
    }
}

export function renderWithProviders(
    ui: React.ReactElement,
    fetchMock: jest.Mock,
    {
        preloadedState = {
            contribution: newContributionState({}),
            notification: { notificationList: [], notificationMap: {} }
        },
        ...renderOptions
    }: ExtendedRenderOptions = {}
) {
    const store = configureStore({
        reducer: {
            contribution: contributionSlice.reducer,
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
const nameTest0 = 'contribution test 0'
const descriptionTest0 = 'a contribution for tests'
const idTest0 = 'id-test-0'
const authorTest1 = 'author test 1'
const contributionResponse0 = {
    name: nameTest0,
    description: descriptionTest0,
    id_persistent: idTest0,
    author: authorTest1,
    has_header: false,
    state: 'UPLOADED'
}
const nameTest1 = 'contribution test 1'
const descriptionTest1 = 'another contribution for tests'
const idTest1 = 'id-test-1'
const contributionResponse1 = {
    name: nameTest1,
    description: descriptionTest1,
    id_persistent: idTest1,
    has_header: true,
    state: 'VALUES_ASSIGNED',
    author: authorTest1
}
test('success and open', async () => {
    const fetchMock = jest.fn()
    addResponseSequence(fetchMock, [
        [200, { contributions: [contributionResponse0, contributionResponse1] }],
        [200, { contributions: [] }]
    ])
    const { store } = renderWithProviders(<ContributionList />, fetchMock)
    await waitFor(() => {
        expect(store.getState()).toEqual({
            contribution: expect.objectContaining({
                contributions: newRemote([
                    newContribution({
                        name: nameTest0,
                        idPersistent: idTest0,
                        description: descriptionTest0,
                        step: ContributionStep.Uploaded,
                        hasHeader: false,
                        author: authorTest1
                    }),
                    newContribution({
                        name: nameTest1,
                        idPersistent: idTest1,
                        description: descriptionTest1,
                        step: ContributionStep.ValuesAssigned,
                        hasHeader: true,
                        author: authorTest1
                    })
                ])
            }),
            notification: { notificationList: [], notificationMap: {} }
        })
    })
    expect(fetchMock.mock.calls).toEqual([
        [
            'http://127.0.0.1:8000/vran/api/contributions/chunk/0/5000',
            {
                credentials: 'include',
                method: 'GET',
                headers: { 'Access-Control-Allow-Credentials': 'true' }
            }
        ],
        [
            'http://127.0.0.1:8000/vran/api/contributions/chunk/5000/5000',
            {
                credentials: 'include',
                method: 'GET',
                headers: { 'Access-Control-Allow-Credentials': 'true' }
            }
        ]
    ])
    await waitFor(() => {
        screen.getByText(nameTest0)
    })
    const label1 = screen.getByText(nameTest1)
    label1.click()
    await waitFor(() => {
        const navigateMock = useNavigate() as jest.Mock
        expect(navigateMock.mock.calls).toEqual([[`/contribute/${idTest1}`]])
    })
})
test('error', async () => {
    const fetchMock = jest.fn()
    const errorMsg = 'error loading credentials'
    addResponseSequence(fetchMock, [
        [200, { contributions: [contributionResponse0, contributionResponse1] }],
        [500, { msg: errorMsg }]
    ])
    const { store } = renderWithProviders(<ContributionList />, fetchMock)
    await waitFor(() => {
        expect(store.getState()).toEqual({
            contribution: expect.objectContaining({
                contributions: newRemote([])
            }),
            notification: {
                notificationList: [
                    expect.objectContaining({
                        type: NotificationType.Error,
                        msg: `Could not load contributions. Reason: "${errorMsg}".`
                    })
                ],
                notificationMap: expect.anything()
            }
        })
    })
    expect(fetchMock.mock.calls).toEqual([
        [
            'http://127.0.0.1:8000/vran/api/contributions/chunk/0/5000',
            {
                credentials: 'include',
                method: 'GET',
                headers: { 'Access-Control-Allow-Credentials': 'true' }
            }
        ],
        [
            'http://127.0.0.1:8000/vran/api/contributions/chunk/5000/5000',
            {
                credentials: 'include',
                method: 'GET',
                headers: { 'Access-Control-Allow-Credentials': 'true' }
            }
        ]
    ])
})
