import { Contribution, ContributionStep } from '../../state'
import {
    LoadContributionDetailsErrorAction,
    LoadContributionDetailsStartAction,
    LoadContributionDetailsSuccessAction,
    PatchContributionDetailsErrorAction,
    PatchContributionDetailsStartAction,
    PatchContributionDetailsSuccessAction
} from '../action'
import { LoadContributionDetailsAction, PatchContributionAction } from '../async_action'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function responseSequence(respones: [number, () => any][]) {
    global.fetch = jest.fn()
    for (const tpl of respones) {
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
                        anonymous: true,
                        has_header: false,
                        state: 'COLUMNS_EXTRACTED'
                    }
                }
            ]
        ])
        const dispatch = jest.fn()
        await new LoadContributionDetailsAction(idTest0).run(dispatch)
        expect(dispatch.mock.calls).toEqual([
            [new LoadContributionDetailsStartAction()],
            [
                new LoadContributionDetailsSuccessAction(
                    new Contribution({
                        name: nameTest0,
                        description: descriptionTest0,
                        idPersistent: idTest0,
                        anonymous: true,
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
        await new LoadContributionDetailsAction(idTest0).run(dispatch)
        expect(dispatch.mock.calls).toEqual([
            [new LoadContributionDetailsStartAction()],
            [
                new LoadContributionDetailsErrorAction(
                    'Could not load contribution details. Reason: "test error".'
                )
            ]
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
                        anonymous: true,
                        has_header: true,
                        state: 'COLUMNS_ASSIGNED'
                    }
                }
            ]
        ])
        const dispatch = jest.fn()
        await new PatchContributionAction({
            idPersistent: idTest0,
            hasHeader: true
        }).run(dispatch)
        expect(dispatch.mock.calls).toEqual([
            [new PatchContributionDetailsStartAction()],
            [
                new PatchContributionDetailsSuccessAction(
                    new Contribution({
                        name: nameTest0,
                        idPersistent: idTest0,
                        description: descriptionTest0,
                        anonymous: true,
                        hasHeader: true,
                        step: ContributionStep.ColumnsAssigned
                    })
                )
            ]
        ])
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
        await new PatchContributionAction({ idPersistent: idTest0 }).run(dispatch)
        expect(dispatch.mock.calls).toEqual([
            [new PatchContributionDetailsStartAction()],
            [
                new PatchContributionDetailsErrorAction(
                    'Could not update contribution. Reason: "test error".'
                )
            ]
        ])
    })
})