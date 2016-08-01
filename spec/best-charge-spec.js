let loadAllItems = require('../src/items');
let loadPromotions = require('../src/promotions');
let {bestCharge, buildReceipt, chooseType, calculateTotalPrices, buildPromotions, buildCartItems, countIds} = require('../src/best-charge');

describe('Take out food', function () {

  it('should count the tags', function () {
    let tags = ['ITEM0001 x 1', 'ITEM0013 x 2'];
    let countedIds = countIds(tags);
    let expected = [
      {
        id: 'ITEM0001',
        count: 1
      },
      {
        id: 'ITEM0013',
        count: 2
      }
    ];

    expect(countedIds).toEqual(expected);
  });

  it('should build cart items', function () {
    let countedIds = [
      {
        id: 'ITEM0001',
        count: 1
      },
      {
        id: 'ITEM0013',
        count: 2
      }
    ];

    let allItems = loadAllItems();

    let cartItems = buildCartItems(countedIds, allItems);
    let expected = [
      {
        id: 'ITEM0001',
        name: '黄焖鸡',
        price: 18.00,
        count: 1
      },
      {
        id: 'ITEM0013',
        name: '肉夹馍',
        price: 6.00,
        count: 2
      }
    ];

    expect(cartItems).toEqual(expected);
  });


  it('build promotions', function () {
    let cartItems = [
      {
        id: 'ITEM0013',
        name: '肉夹馍',
        price: 6.00,
        count: 2
      },

      {
        id: 'ITEM0022',
        name: '凉皮',
        price: 8.00,
        count: 3
      }
    ];
    let promotions = loadPromotions();
    let promotedItems = buildPromotions(cartItems, promotions);

    let expected = [
      {
        id: 'ITEM0013',
        name: '肉夹馍',
        price: 6.00,
        count: 2,
        payPrice: 12,
        saved: 0
      },

      {
        id: 'ITEM0022',
        name: '凉皮',
        price: 8.00,
        count: 3,
        payPrice: 12,
        saved: 12
      }
    ]

    expect(promotedItems).toEqual(expected);
  });


  it('calculate totalPrices and choose 指定菜品半价', function () {
    let promotedItems = [
      {
        id: 'ITEM0013',
        name: '肉夹馍',
        price: 6.00,
        count: 2,
        payPrice: 12,
        saved: 0
      },

      {
        id: 'ITEM0022',
        name: '凉皮',
        price: 8.00,
        count: 3,
        payPrice: 12,
        saved: 12
      }
    ];

    let totalPrices = calculateTotalPrices(promotedItems);

    let expected = {
      totalPayPrice: 24,
      totalSaved: 12
    }

    expect(totalPrices).toEqual(expected);
  })

  it('choose 指定菜品半价', function () {
    let totalPrice = {
      totalPayPrice: 24,
      totalSaved: 12
    };

    let promotions = loadPromotions();
    let chosenTypePrice = chooseType(totalPrice, promotions);

    let expected = {
      totalPayPrice: 24,
      totalSaved: 12,
      chosenType: '指定菜品半价'
    }

    expect(chosenTypePrice).toEqual(expected);
  });

  it('choose 满30减6元', function () {
    let totalPrice = {
      totalPayPrice: 30,
      totalSaved: 0
    };

    let promotions = loadPromotions();
    let chosenTypePrice = chooseType(totalPrice, promotions);

    let expected = {
      totalPayPrice: 24,
      totalSaved: 6,
      chosenType: '满30减6元'
    }
    expect(chosenTypePrice).toEqual(expected);
  });

  it('没有优惠', function () {
    let totalPrice = {
      totalPayPrice: 24,
      totalSaved: 0
    };

    let promotions = loadPromotions();
    let chosenTypePrice = chooseType(totalPrice, promotions);

    let expected = {
      totalPayPrice: 24,
      totalSaved: 0,
      chosenType: ''
    }
    expect(chosenTypePrice).toEqual(expected);
  });

  it('build receipt', function () {
    let promotedItems = [
      {
        id: 'ITEM0013',
        name: '肉夹馍',
        price: 6.00,
        count: 2,
        payPrice: 12,
        saved: 0
      },

      {
        id: 'ITEM0022',
        name: '凉皮',
        price: 8.00,
        count: 3,
        payPrice: 12,
        saved: 12
      }
    ];

    let chosenTypePrice = {
      totalPayPrice: 24,
      totalSaved: 12,
      chosenType: '指定菜品半价'
    };

    let receipt = buildReceipt(promotedItems, chosenTypePrice);

    let expected = {
      receiptItems: [
        {
          name: '肉夹馍',
          price: 6.00,
          count: 2,
          payPrice: 12,
          saved: 0
        },
        {
          name: '凉皮',
          price: 8.00,
          count: 3,
          payPrice: 12,
          saved: 12
        }
      ],
      totalPayPrice: 24,
      totalSaved: 12,
      chosenType: '指定菜品半价'
    }

    expect(receipt).toEqual(expected);
  })

  fit('should generate best charge when best is 指定菜品半价', function () {
    let inputs = ["ITEM0001 x 1", "ITEM0013 x 2", "ITEM0022 x 1"];
    let summary = bestCharge(inputs).trim();
    let expected = `
============= 订餐明细 =============
黄焖鸡 x 1 = 18元
肉夹馍 x 2 = 12元
凉皮 x 1 = 8元
-----------------------------------
使用优惠:
指定菜品半价(黄焖鸡，凉皮)，省13元
-----------------------------------
总计：25元
===================================`.trim()
    expect(summary).toEqual(expected)
  });

  fit('should generate best charge when best is 满30减6元', function () {
    let inputs = ["ITEM0013 x 4", "ITEM0022 x 1"];
    let summary = bestCharge(inputs).trim();
    let expected = `
============= 订餐明细 =============
肉夹馍 x 4 = 24元
凉皮 x 1 = 8元
-----------------------------------
使用优惠:
满30减6元，省6元
-----------------------------------
总计：26元
===================================`.trim()
    expect(summary).toEqual(expected)
  });

  fit('should generate best charge when no promotion can be used', function () {
    let inputs = ["ITEM0013 x 4"];
    let summary = bestCharge(inputs).trim();
    let expected = `
============= 订餐明细 =============
肉夹馍 x 4 = 24元
-----------------------------------
总计：24元
===================================`.trim()
    expect(summary).toEqual(expected)
  });

});
