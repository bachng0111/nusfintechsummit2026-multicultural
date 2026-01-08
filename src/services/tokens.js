import tokens from '../data/tokens.json';
import events from '../data/events.json';

export const statusOrder = [
  'Issued',
  'Listed',
  'Purchased',
  'Held',
  'Retired',
  'OffsetCertified',
];

export const getTokens = async () => {
  return tokens;
};

export const getEvents = async () => {
  return events;
};

export const getEventsByToken = (tokenId) => {
  return events
    .filter((event) => event.tokenId === tokenId)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
};

export const getSummaryCounts = (tokenList) => {
  const base = statusOrder.reduce((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {});

  tokenList.forEach((token) => {
    if (base[token.status] !== undefined) {
      base[token.status] += 1;
    }
  });

  return base;
};

export const getStatusIndex = (status) => {
  const idx = statusOrder.indexOf(status);
  return idx === -1 ? 0 : idx;
};
