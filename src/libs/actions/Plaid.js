import Onyx from 'react-native-onyx';
import getPlaidLinkTokenParameters from '../getPlaidLinkTokenParameters';
import ONYXKEYS from '../../ONYXKEYS';
import * as API from '../API';
import * as Localize from '../Localize';

/**
 * List of bank accounts. This data should not be stored in Onyx since it contains unmasked PANs.
 *
 * @private
 */
let unmaskedPlaidBankAccounts = [];
let bankName = '';
let plaidAccessToken = '';

/**
 * We clear these out of storage once we are done with them so the user must re-enter Plaid credentials upon returning.
 */
function clearPlaidBankAccountsAndToken() {
    unmaskedPlaidBankAccounts = [];
    bankName = '';
    Onyx.set(ONYXKEYS.PLAID_BANK_ACCOUNTS, {});
    Onyx.set(ONYXKEYS.PLAID_LINK_TOKEN, null);
}

/**
 * Gets the Plaid Link token used to initialize the Plaid SDK
 * @param {Boolean} allowDebit
 */
function openPlaidBankLogin(allowDebit) {
    const params = getPlaidLinkTokenParameters();
    params.allowDebit = allowDebit;
    API.read('OpenPlaidBankLogin', params);
}

/**
 * @param {String} publicToken
 * @param {String} bank
 * @param {Boolean} allowDebit
 */
function openPlaidBankAccountSelector(publicToken, bank, allowDebit) {
    bankName = bank;

    API.makeRequestWithSideEffects('OpenPlaidBankAccountSelector', {
        publicToken,
        allowDebit,
        bank,
    }, {
        optimisticData: [{
            onyxMethod: 'merge',
            key: ONYXKEYS.PLAID_BANK_ACCOUNTS,
            value: {loading: true, error: ''},
        }],
        successData: [{
            onyxMethod: 'merge',
            key: ONYXKEYS.PLAID_BANK_ACCOUNTS,
            value: {loading: false, error: ''},
        }],
        failureData: [{
            onyxMethod: 'merge',
            key: ONYXKEYS.PLAID_BANK_ACCOUNTS,
            value: {
                loading: false,
                error: Localize.translateLocal('bankAccount.error.noBankAccountAvailable'),
            },
        }],
    }).then((response) => {
        // Errors and bankAccounts to display are directly put in Onyx PHP side
        // But we need to keep track of unmaskedAccountNumbers and plaidAccessToken here, so we can send them back to create the bank account
        unmaskedPlaidBankAccounts = response.unmaskedAccountNumbers;
        plaidAccessToken = response.plaidAccessToken;
    });
}

/**
 * @returns {String}
 */
function getPlaidAccessToken() {
    return plaidAccessToken;
}

/**
 * @returns {Array}
 */
function getUnmaskedPlaidBankAccounts() {
    return unmaskedPlaidBankAccounts;
}

/**
 * @returns {String}
 */
function getBankName() {
    return bankName;
}

export {
    clearPlaidBankAccountsAndToken,
    openPlaidBankAccountSelector,
    openPlaidBankLogin,
    getPlaidAccessToken,
    getUnmaskedPlaidBankAccounts,
    getBankName,
};
