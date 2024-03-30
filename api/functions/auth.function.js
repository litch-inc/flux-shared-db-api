'use strict';

/**
 * Used for checking ip ip belongs to whitelist or opnodes
 *
 * @param {*} ip
 * @return {boolean}
 */
const ipCheck = (ip, opNodes) => {
  const whiteList = process.env.WHITELIST_IPS.split(',');
  if (whiteList.length && whiteList.includes(ip)) {
    return true;
  } else {
    // only operator nodes can connect
    const opNodesIps = opNodes.map((item) => item.ip);

    return opNodesIps.includes(ip);
  }
};

module.exports = {
  ipCheck
};
