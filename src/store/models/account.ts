import { createModel } from '@rematch/core';
import dotProp from 'dot-prop-immutable';

import {
  listTransactions,
  listUnspent,
  login as nspvLogin,
  logout as nspvLogout,
} from 'util/nspvlib';
import { TxType, UnspentType } from 'util/nspvlib-mock';
import {
  getStillUnconfirmed,
  parseSpendTx,
  parseTransactions,
  parseUnspent,
} from 'util/transactions';

import type { RootModel } from './models';

export interface AccountState {
  address?: string;
  unspent?: UnspentType;
  txs: {
    [address: string]: Array<TxType>;
  };
  key: string;
  chosenTx: TxType;
}

interface LoginArgs {
  key: string;
  setError: (message: string) => void;
  setFeedback: (message: string) => void;
}

export default createModel<RootModel>()({
  state: {
    address: null,
    unspent: null,
    txs: {},
    key: null,
  } as AccountState,
  reducers: {
    SET_ADDRESS: (state, address: string) => ({
      ...state,
      address,
    }),
    SET_TXS: (state, txs: Array<TxType>) => {
      if (!state.address) {
        return state;
      }
      const unconfirmed = getStillUnconfirmed(txs, state.txs[state.address]);
      const newTxs = [...unconfirmed, ...txs];
      return dotProp.set(state, `txs.${state.address}`, parseTransactions(newTxs));
    },
    ADD_NEW_TX: (state, transaction: TxType) =>
      dotProp.set(state, `txs.${state.address}`, list => [parseSpendTx(transaction), ...list]),
    SET_UNSPENT: (state, unspent: UnspentType) => ({
      ...state,
      unspent,
    }),
    SET_CHOSEN_TX: (state, chosenTx: TxType) => ({
      ...state,
      chosenTx,
    }),
    SET_KEY: (state, key: string) => ({
      ...state,
      key,
    }),
  },
  effects: dispatch => ({
    async login({ key = null, setError, setFeedback }: LoginArgs) {
      setError(null);
      setFeedback('Connecting to nspv...');
      const userKey = key ?? this.key;
      if (!this.key) {
        this.SET_KEY(key);
      }
      nspvLogin(userKey)
        .then(async account => {
          this.SET_ADDRESS(account.address);
          setFeedback('Loging in to nspv...');

          const unspent = await listUnspent();
          this.SET_UNSPENT(unspent);
          dispatch.wallet.SET_ASSETS(parseUnspent(unspent));

          setFeedback('Getting transactions...');
          const transactions = await listTransactions(account.address);
          this.SET_TXS(transactions.txids);
          return null;
        })
        .catch(e => {
          setFeedback(null);
          setError(e.message);
        });
    },
    async logout() {
      dispatch({ type: 'RESET_APP' });
      return nspvLogout();
    },
  }),
});
