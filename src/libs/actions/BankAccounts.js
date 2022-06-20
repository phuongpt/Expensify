import lodashGet from 'lodash/get';
import CONST from '../../CONST';
import * as DeprecatedAPI from '../deprecatedAPI';
import * as API from '../API';
import * as Plaid from './Plaid';
import * as ReimbursementAccount from './ReimbursementAccount';
import ONYXKEYS from '../../ONYXKEYS';
import Growl from '../Growl';
import * as Localize from '../Localize';
import * as store from './ReimbursementAccount/store';
import requireParameters from '../requireParameters';

export {
    setupWithdrawalAccount,
    fetchFreePlanVerifiedBankAccount,
    goToWithdrawalAccountSetupStep,
    showBankAccountErrorModal,
    showBankAccountFormValidationError,
    setBankAccountFormValidationErrors,
    resetFreePlanBankAccount,
    validateBankAccount,
    hideBankAccountErrors,
    setWorkspaceIDForReimbursementAccount,
    setBankAccountSubStep,
    updateReimbursementAccountDraft,
    requestResetFreePlanBankAccount,
    cancelResetFreePlanBankAccount,
} from './ReimbursementAccount';
export {
    openPlaidBankAccountSelector,
    clearPlaidBankAccountsAndToken,
    openPlaidBankLogin,
    getUnmaskedPlaidBankAccounts,
    getBankName,
    getPlaidAccessToken,
} from './Plaid';
export {
    fetchOnfidoToken,
    activateWallet,
    fetchUserWallet,
} from './Wallet';

/**
 * Adds a bank account via Plaid
 *
 * @param {Object} account
 * @param {String} password
 * @param {String} plaidLinkToken
 * @param {String} plaidAccessToken
 */
function addPersonalBankAccount(account, password, plaidLinkToken, plaidAccessToken) {
    const commandName = 'AddPersonalBankAccount';

    const parameters = {
        accountNumber: account.accountNumber,
        addressName: account.addressName,
        allowDebit: false,
        confirm: false,
        isSavings: account.isSavings,
        password,
        routingNumber: account.routingNumber,
        setupType: 'plaid',
        additionalData: {
            useOnFido: false,
            policyID: '',
            plaidLinkToken,
            isInSetup: true,
            bankAccountInReview: null,
            currentStep: 'AccountOwnerInformationStep',
            bankName: Plaid.getBankName(),
            plaidAccountID: account.plaidAccountID,
            ownershipType: '',
            acceptTerms: true,
            country: 'US',
            currency: CONST.CURRENCY.USD,
            fieldsType: 'local',
            plaidAccessToken,
        },
    };

    requireParameters([
        'accountNumber',
        'addressName',
        'isSavings',
        'password',
        'routingNumber',
    ], parameters, commandName);

    const onyxData = {
        optimisticData: [
            {
                onyxMethod: 'merge',
                key: ONYXKEYS.REIMBURSEMENT_ACCOUNT,
                value: {
                    loading: true,
                    error: '',
                },
            },
        ],
        successData: [
            {
                onyxMethod: 'merge',
                key: ONYXKEYS.REIMBURSEMENT_ACCOUNT,
                value: {
                    loading: false,
                    error: '',
                    success: 'Your bank account has been successfully added',
                },
            },
        ],
        failureData: [
            {
                onyxMethod: 'merge',
                key: ONYXKEYS.REIMBURSEMENT_ACCOUNT,
                value: {
                    loading: false,
                    error: 'aGenericErrorThatMightGetOverriddenByAServerOneIfItExistsInTheResponse',
                },
            },
        ],
    };
    console.log('onyxData', onyxData);

    API.write(commandName, parameters, onyxData);
}

/**
 * Deletes a bank account
 *
 * @param {Number} bankAccountID
 */
function deleteBankAccount(bankAccountID) {
    const reimbursementBankAccountId = lodashGet(store.getReimbursementAccountInSetup(), 'bankAccountID');

    // Early return as DeleteBankAccount API is called inside `resetFreePlanBankAccount`
    if (reimbursementBankAccountId === bankAccountID) {
        ReimbursementAccount.resetFreePlanBankAccount();
        return;
    }
    DeprecatedAPI.DeleteBankAccount({
        bankAccountID,
    }).then((response) => {
        if (response.jsonCode === 200) {
            ReimbursementAccount.deleteFromBankAccountList(bankAccountID);
            Growl.show(Localize.translateLocal('paymentsPage.deleteBankAccountSuccess'), CONST.GROWL.SUCCESS, 3000);
        } else {
            Growl.show(Localize.translateLocal('common.genericErrorMessage'), CONST.GROWL.ERROR, 3000);
        }
    }).catch(() => {
        Growl.show(Localize.translateLocal('common.genericErrorMessage'), CONST.GROWL.ERROR, 3000);
    });
}

export {
    addPersonalBankAccount,
    deleteBankAccount,
};
