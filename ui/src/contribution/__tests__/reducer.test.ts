import { Remote } from '../../util/state'
import {
    LoadContributionsErrorAction,
    LoadContributionsStartAction,
    LoadContributionsSuccessAction,
    ToggleShowAddContributionAction
} from '../actions'
import { contributionReducer } from '../reducer'
import { ContributionStep, newContribution, newContributionState } from '../state'

const authorTest = 'author test'
describe('load contributions', () => {
    test('start loading', () => {
        const initialState = newContributionState({})
        const expectedState = newContributionState({
            contributions: new Remote([], true)
        })
        const endState = contributionReducer(
            initialState,
            new LoadContributionsStartAction()
        )
        expect(endState).toEqual(expectedState)
    })
    const contributionTest = newContribution({
        name: 'test contribution',
        idPersistent: 'id-contribution-test',
        description: 'contribution description for test',
        step: ContributionStep.Uploaded,
        author: authorTest,
        hasHeader: false
    })
    test(' loading success', () => {
        const initialState = newContributionState({
            contributions: new Remote([], true)
        })
        const expectedState = newContributionState({
            contributions: new Remote([contributionTest])
        })
        const endState = contributionReducer(
            initialState,
            new LoadContributionsSuccessAction([contributionTest])
        )
        expect(endState).toEqual(expectedState)
    })
    test('set error', () => {
        const initialState = newContributionState({
            contributions: new Remote([], true)
        })
        const expectedState = newContributionState({
            contributions: new Remote([], false)
        })
        const endState = contributionReducer(
            initialState,
            new LoadContributionsErrorAction()
        )
        expect(endState).toEqual(expectedState)
    })
})

describe('toggle show contribution', () => {
    test('show', () => {
        const initialState = newContributionState({})
        const expectedState = newContributionState({
            showAddContribution: new Remote(true)
        })
        const endState = contributionReducer(
            initialState,
            new ToggleShowAddContributionAction()
        )
        expect(endState).toEqual(expectedState)
    })
    test('hide', () => {
        const initialState = newContributionState({
            showAddContribution: new Remote(true)
        })
        const expectedState = newContributionState({})
        const endState = contributionReducer(
            initialState,
            new ToggleShowAddContributionAction()
        )
        expect(endState).toEqual(expectedState)
    })
})
