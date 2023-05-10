import { Contribution } from '../state'

/**
 * Indicates start of loading a contribution
 */
export class LoadContributionDetailsStartAction {}

/**
 * Indicates a successful loading of a contribution
 */
export class LoadContributionDetailsSuccessAction {
    contribution: Contribution

    constructor(contribution: Contribution) {
        this.contribution = contribution
    }
}

/**
 * Indicates error during loading of contribution
 */
export class LoadContributionDetailsErrorAction {
    msg: string
    constructor(msg: string) {
        this.msg = msg
    }
}

/**
 * Indicates start of contribution patch
 */
export class PatchContributionDetailsStartAction {}

/**
 * Indicates a successful contribution patch
 */
export class PatchContributionDetailsSuccessAction {
    contribution: Contribution

    constructor(contribution: Contribution) {
        this.contribution = contribution
    }
}

/**
 * Indidcates an error during contribution patch
 */
export class PatchContributionDetailsErrorAction {
    msg: string
    constructor(msg: string) {
        this.msg = msg
    }
}

/**
 * Indicate that the error of patching contributions should be cleared
 */
export class PatchContributionDetailsClearErrorAction {}

export type ContributionDetailsAction =
    | LoadContributionDetailsStartAction
    | LoadContributionDetailsSuccessAction
    | LoadContributionDetailsErrorAction
    | PatchContributionDetailsStartAction
    | PatchContributionDetailsSuccessAction
    | PatchContributionDetailsErrorAction
    | PatchContributionDetailsClearErrorAction