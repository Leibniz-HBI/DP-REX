import { addError } from '../../../util/notification/slice'
import { ContributionStep, newContribution } from '../../state'
import {
    LoadContributionDetailsErrorAction,
    LoadContributionDetailsStartAction,
    LoadContributionDetailsSuccessAction,
    PatchContributionDetailsErrorAction,
    PatchContributionDetailsStartAction,
    PatchContributionDetailsSuccessAction
} from '../action'
import {
    LoadContributionDetailsAsyncAction,
    PatchContributionAction
} from '../async_action'

jest.mock('../../../util/notification/slice', () => {
    const addErrorMock = jest.fn()
    return {
        ...jest.requireActual('../../../util/notification/slice'),
        addError: addErrorMock
    }
})

beforeEach(() => {
    ;(addError as unknown as jest.Mock).mockReset()
})

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

const nameTest0 = 'contribution test 0'
const descriptionTest0 = 'a contribution for tests'
const idTest0 = 'id-test-0'
const authorTest = 'author test'
describe('get details', () => {
    test('correct response', async () => {
        responseSequence([
            [
                200,
                () => {
                    return {
                        name: nameTest0,
                        description: descriptionTest0,
                        id_persistent: idTest0,
                        author: authorTest,
                        has_header: false,
                        state: 'COLUMNS_EXTRACTED'
                    }
                }
            ]
        ])
        const dispatch = jest.fn()
        const reduxDispatch = jest.fn()
        await new LoadContributionDetailsAsyncAction(idTest0).run(
            dispatch,
            reduxDispatch
        )
        expect(dispatch.mock.calls).toEqual([
            [new LoadContributionDetailsStartAction()],
            [
                new LoadContributionDetailsSuccessAction(
                    newContribution({
                        name: nameTest0,
                        description: descriptionTest0,
                        idPersistent: idTest0,
                        author: authorTest,
                        hasHeader: false,
                        step: ContributionStep.ColumnsExtracted
                    })
                )
            ]
        ])
        expect((fetch as jest.Mock).mock.calls).toEqual([
            [
                'http://127.0.0.1:8000/vran/api/contributions/id-test-0',
                { credentials: 'include' }
            ]
        ])
        expect(reduxDispatch.mock.calls.length).toEqual(0)
    })
    test('error response', async () => {
        responseSequence([
            [
                500,
                () => {
                    return { msg: 'test error' }
                }
            ]
        ])
        const dispatch = jest.fn()
        const reduxDispatch = jest.fn()
        await new LoadContributionDetailsAsyncAction(idTest0).run(
            dispatch,
            reduxDispatch
        )
        expect(dispatch.mock.calls).toEqual([
            [new LoadContributionDetailsStartAction()],
            [new LoadContributionDetailsErrorAction()]
        ])
        expect((addError as unknown as jest.Mock).mock.calls).toEqual([
            ['Could not load contribution details. Reason: "test error".']
        ])
    })
})

describe('patch contribution', () => {
    test('success', async () => {
        responseSequence([
            [
                200,
                () => {
                    return {
                        name: nameTest0,
                        description: descriptionTest0,
                        id_persistent: idTest0,
                        author: authorTest,
                        has_header: true,
                        state: 'COLUMNS_ASSIGNED'
                    }
                }
            ]
        ])
        const dispatch = jest.fn()
        const reduxDispatch = jest.fn()
        await new PatchContributionAction({
            idPersistent: idTest0,
            hasHeader: true
        }).run(dispatch, reduxDispatch)
        expect(dispatch.mock.calls).toEqual([
            [new PatchContributionDetailsStartAction()],
            [
                new PatchContributionDetailsSuccessAction(
                    newContribution({
                        name: nameTest0,
                        idPersistent: idTest0,
                        description: descriptionTest0,
                        author: authorTest,
                        hasHeader: true,
                        step: ContributionStep.ColumnsAssigned
                    })
                )
            ]
        ])
        expect(reduxDispatch.mock.calls.length).toEqual(0)
        const body: { [key: string]: string | boolean } = { has_header: true }
        expect((fetch as jest.Mock).mock.calls).toEqual([
            [
                'http://127.0.0.1:8000/vran/api/contributions/id-test-0',
                { method: 'PATCH', credentials: 'include', body: JSON.stringify(body) }
            ]
        ])
    })
    test('server error', async () => {
        responseSequence([
            [
                500,
                () => {
                    return { msg: 'test error' }
                }
            ]
        ])
        const dispatch = jest.fn()
        const reduxDispatch = jest.fn()
        await new PatchContributionAction({ idPersistent: idTest0 }).run(
            dispatch,
            reduxDispatch
        )
        expect(dispatch.mock.calls).toEqual([
            [new PatchContributionDetailsStartAction()],
            [new PatchContributionDetailsErrorAction()]
        ])
        expect((addError as unknown as jest.Mock).mock.calls).toEqual([
            ['Could not update contribution. Reason: "test error".']
        ])
    })
})
