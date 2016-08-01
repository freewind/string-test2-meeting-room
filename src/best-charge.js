let _ = require('lodash');
let loadAllItems = require('./items');
let loadPromotions = require('./promotions');

function bestCharge(selectedItems) {
  let countedIds = countIds(selectedItems);
  let allItems = loadAllItems();
  let cartItems = buildCartItems(countedIds, allItems);
  let promotions = loadPromotions();
  let triedPromotions = [
    tryPromotionHalfPrice(cartItems, promotions),
    tryPromotionWhen30Minus6(cartItems, promotions)
  ];
  let bestPromotionResult = findBestPromotionResult(triedPromotions);
  let receiptString = buildReceiptString(bestPromotionResult);

  return receiptString;
}

function countIds(tags) {
  return _.map(tags, (tag) => {
    let [id,count] = tag.split(' x ');
    return {id, count: parseFloat(count)};
  });
}

function _getExistElementByIds(array, id) {
  return array.find((element) => element.id === id);
}

function buildCartItems(countedIds, allItems) {
  return _.map(countedIds, ({id, count}) => {
    let {name, price} = _getExistElementByIds(allItems, id);
    return {id, name, price, count};
  })
}

function tryPromotionHalfPrice(cartItems, promotions) {
  let promotionType = '指定菜品半价';
  let promotion = promotions.find((promotion) => promotion.type === promotionType);
  if (promotion === null) return null;

  let calculatedItems = cartItems.map((cartItem) => {
    let canPromote = promotion.items.includes(cartItem.id);
    let saved = canPromote ? cartItem.price / 2 * cartItem.count : 0;
    let totalPrice = cartItem.price * cartItem.count;
    let payPrice = totalPrice - saved;
    return Object.assign({}, cartItem, {
      totalPrice, payPrice, saved
    });
  });
  let promotedItemNames = _(calculatedItems)
    .filter(calculatedItem => calculatedItem.saved > 0)
    .map(calculatedItem => calculatedItem.name)
    .value();
  let totalPayPrice = _(calculatedItems).map(calculatedItem=>calculatedItem.payPrice).sum();
  let totalSaved = _(calculatedItems).map(calculatedItem=>calculatedItem.saved).sum();
  return {
    calculatedItems, promotedItemNames, totalPayPrice, totalSaved, promotionType
  };
}

function tryPromotionWhen30Minus6(cartItems, promotions) {
  let promotionType = '满30减6元';
  let promotion = promotions.find((promotion) => promotion.type === promotionType);
  if (promotion === null) return null;

  let calculatedItems = _.map(cartItems, cartItem => {
    let totalPrice = cartItem.price * cartItem.count;
    return Object.assign({}, cartItem, {
      totalPrice, payPrice: totalPrice, saved: 0
    })
  });
  let totalPrice = _(cartItems).map(({price, count}) => price * count).sum();
  let totalSaved = totalPrice >= 30 ? 6 : 0;
  let totalPayPrice = totalPrice - totalSaved;
  return {
    calculatedItems, promotedItemNames: [],
    totalPayPrice, totalSaved, promotionType
  };
}

function findBestPromotionResult(triedPromotions) {
  return _.minBy(triedPromotions, ({totalPayPrice}) => totalPayPrice);
}

function buildReceiptString(promotionResult) {
  let lines = ['============= 订餐明细 ============='];
  _.reduce(promotionResult.calculatedItems, (lines, {name, count, totalPrice}) => {
    lines.push(`${name} x ${count} = ${totalPrice}元`);
    return lines;
  }, lines);
  if (promotionResult.totalSaved > 0) {
    lines.push('-----------------------------------');
    lines.push('使用优惠:');
    let line = promotionResult.promotionType;
    if (promotionResult.promotedItemNames.length > 0) {
      line += "(" + promotionResult.promotedItemNames.join('，') + ")";
    }
    line += `，省${promotionResult.totalSaved}元`;
    lines.push(line);
  }

  lines.push('-----------------------------------');
  lines.push(`总计：${promotionResult.totalPayPrice}元`);
  lines.push('===================================');
  return lines.join('\n');
}

module.exports = {
  bestCharge, tryPromotionHalfPrice, buildCartItems, countIds
};
