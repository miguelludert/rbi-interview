import {
  menuHandler,
  cartHandler,
  calorieCounterHandler,
  getMinMaxCaloriesInItem,
  ComboItem,
} from "..";
/**
 * These tests only provide a basic assessment of correctness.
 *
 * Feel free to modify as you find necessary.
 */

describe("Homework", () => {
  describe("Question #1: Menu", () => {
    interface ExpectedMenuResponse {
      data: [
        {
          _id: string;
          options: [any];
        }
      ];
    }

    const expectedResponseShape = {
      body: expect.any(String),
      statusCode: expect.any(Number),
    };

    it("should return the correct data shape", async () => {
      const response = await menuHandler();
      const {
        data: [{ _id, options }],
      } = JSON.parse(response.body) as ExpectedMenuResponse;
      expect(_id).toEqual("menu_1");
      expect(options.length).toEqual(7);
      expect(response).toEqual(expectedResponseShape);
      expect(response).toMatchSnapshot();
    });
  });

  describe("Question #2: Cart", () => {
    const expectedResponseShape = {
      body: expect.any(String),
      statusCode: expect.any(Number),
    };
    const expectedWithPluAndId = {
      id: expect.any(Number),
      plunum: expect.any(String),
    };

    it("should return the correct data shape", async () => {
      const response = await cartHandler();
      const {
        data: { cart },
      } = JSON.parse(response.body);
      const { items } = cart.order;

      items.forEach((item) => {
        expect(item).toMatchObject(expectedWithPluAndId);
        item.modifiers.forEach((mod) => {
          expect(mod).toMatchObject(expectedWithPluAndId);
        });
      });

      expect(response).toEqual(expectedResponseShape);
      expect(response).toMatchSnapshot();
    });
  });

  describe("Question #3: Calorie counter", () => {
    const expectedResponseShape = {
      body: expect.any(String),
      statusCode: expect.any(Number),
    };

    describe("getMinMaxCaloriesInItem", () => {
      it("should return one of each item", async () => {
        const item: ComboItem = {
          amountRequiredToSelect: 4,
          comboItemOptions: [
            {
              minAmount: 1,
              maxAmount: 1,
              option: {
                nutrition: {
                  calories: 160,
                },
              },
            },
            {
              minAmount: 1,
              maxAmount: 1,
              option: {
                nutrition: {
                  calories: 280,
                },
              },
            },
            {
              minAmount: 1,
              maxAmount: 1,
              option: {
                nutrition: {
                  calories: 380,
                },
              },
            },
            {
              minAmount: 1,
              maxAmount: 1,
              option: {
                nutrition: {
                  calories: 210,
                },
              },
            },
          ],
        };
        const actual = await getMinMaxCaloriesInItem(item);
        const expected = {
          minCalories: 1030,
          maxCalories: 1030,
        };
        expect(actual).toEqual(expected);
      });
      it("should return return different min/max", async () => {
        const item: ComboItem = {
          amountRequiredToSelect: 4,
          comboItemOptions: [
            {
              minAmount: 1,
              maxAmount: 2,
              option: {
                nutrition: {
                  calories: 3,
                },
              },
            },
            {
              minAmount: 0,
              maxAmount: 2,
              option: {
                nutrition: {
                  calories: 500,
                },
              },
            },
            {
              minAmount: 0,
              maxAmount: 3,
              option: {
                nutrition: {
                  calories: 9000,
                },
              },
            },
            {
              minAmount: 0,
              maxAmount: 1,
              option: {
                nutrition: {
                  calories: 3000,
                },
              },
            },
          ],
        };
        const actual = await getMinMaxCaloriesInItem(item);
        const expected = {
          minCalories: 1006,
          maxCalories: 30000,
        };
        expect(actual).toEqual(expected);
      });
      it("should calculate sides correctly", async () => {
        const item: ComboItem = {
          amountRequiredToSelect: 4,
          comboItemOptions: [
            {
              minAmount: 0,
              maxAmount: 9,
              option: {
                nutrition: {
                  calories: 268,
                },
              },
            },
            {
              minAmount: 0,
              maxAmount: 9,
              option: {
                nutrition: {
                  calories: 247,
                },
              },
            },
            {
              minAmount: 0,
              maxAmount: 9,
              option: {
                nutrition: {
                  calories: 110,
                },
              },
            },
            {
              minAmount: 0,
              maxAmount: 9,
              option: {
                nutrition: {
                  calories: 183,
                },
              },
            },
            {
              minAmount: 0,
              maxAmount: 9,
              option: {
                nutrition: {
                  calories: 140,
                },
              },
            },
            {
              minAmount: 0,
              maxAmount: 9,
              option: {
                nutrition: {
                  calories: 55,
                },
              },
            },
          ],
        };
        const actual = await getMinMaxCaloriesInItem(item);
        const expected = {
          minCalories: 220,
          maxCalories: 1072,
        };
        expect(actual).toEqual(expected);
      });
    });

    getMinMaxCaloriesInItem;
    it("should return the correct data shape", async () => {
      const response = await calorieCounterHandler();
      const { data } = JSON.parse(response.body);
      expect(response).toEqual(expectedResponseShape);
      expect(response).toMatchSnapshot();
    });
  });
});
