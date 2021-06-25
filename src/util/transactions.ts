import moment from 'moment';

import { FEE, TICKER, USD_VALUE } from 'vars/defines';

import getTransactionDetail from './insightApi';

export const parseSerializedTransaction = (tx, address) => {
  return {
    value: Number(tx.vout[0].value),
    from: [...new Set(tx.vin.map(v => v.addr).flat())],
    recipient: tx.vout[0].scriptPubKey.addresses[0],
    time: moment.unix(tx.time).format('DD/MM/YYYY H:mm:ss'),
    txid: tx.txid,
    height: tx.blockheight,
    received: tx.vout[0].scriptPubKey.addresses[0] === address,
  };
};

/**
 * Groups transactions from listtransactions output by txids
 * @param txs     listtransactions.txids
 * @returns
 */
export const groupTransactions = txs => {
  if (!txs.length) {
    return [];
  }
  const parsedTxs = {};
  // @todo change later
  // we only show 3 top transactions at the moment so we dont need to parse everything now
  txs.sort((a, b) => b.height - a.height);
  txs.slice(0, 9).forEach(tx => {
    if (!parsedTxs[tx.txid]) {
      parsedTxs[tx.txid] = [];
    }
    parsedTxs[tx.txid].push(tx);
  });
  return parsedTxs;
};

/**
 * Parse spend rpc output
 * @param tx spend.tx
 * @returns
 */
export const parseSpendTx = (newtx, from) => {
  return {
    received: false,
    unconfirmed: true,
    txid: newtx.tx.txid,
    height: newtx.tx.height ?? 'TBA',
    value: Number(newtx.tx.total) - Number(newtx.tx.change) - FEE,
    recipient: newtx.recipient,
    time: newtx.time,
    from,
  };
};

// retcode < 0 .. error, === 1 success
export const spendSuccess = broadcasted => broadcasted.retcode === 1;
/**
 * Parse listunspent output
 * @param unspent
 * @returns
 */
export const parseUnspent = unspent => {
  return [
    {
      name: TICKER,
      ticker: TICKER,
      balance: unspent.balance,
      usd_value: USD_VALUE,
    },
  ];
};

/**
 * Filter out the transactions which are still not confirmed in the new incoming tx batch
 * @param txs new incomings txs
 * @param unconfirmed current unconfirmed txs saved in the state
 * @returns
 */
export const getStillUnconfirmed = (newTxs, currentTxs) => {
  if (!currentTxs || currentTxs.length === 0) {
    return [];
  }
  const unconfirmed = currentTxs.filter(tx => tx.unconfirmed);
  return unconfirmed.filter(txid => !newTxs.find(tx => tx.txid === txid.txid));
};

/**
 * Gets details of all transactions
 * @param txs
 * @returns
 */
export const getAllTransactionDetails = async txs => {
  const txids = Object.keys(groupTransactions(txs));
  const promises = txids.map(tx => getTransactionDetail(tx));
  return Promise.all(promises);
};
