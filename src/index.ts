import { readFileSync } from "fs";
import { join } from "path";
import { memoizeWith, sortBy, prop, map, reverse, lensProp } from "ramda";
import menuJson from './data/menu.json';
import plusJson from './data/plus.json';
import cartJson from './data/cart.json';
import chickenJson  from './data/4pc-chicken.json';

/**
 * Problem #1: Return the PLK menu
 * - Respond to `GET /menu` requests
 * - Return `./data/menu.json` on a `data` property
 *
 * Example response:
 * ```json
 * HTTP 200
 * { data: $menu }
 * ```
 */

export interface MenuData {
  allMenus: any[];
}
export async function menuHandler() {
  const { allMenus }: MenuData = menuJson;
  return {
    body: JSON.stringify({
      data: allMenus,
    }),
    statusCode: 200,
  };
}

/**
 * Problem #2: Map PLU to `itemId` on the user's cart
 * - Respond to `GET /cart` requests
 * - Add an `itemId` property on all items (`order.items[]`)
 *   and modifiers (`order.items[].modifiers[]`) in the cart defined
 *   by `./data/cart.json`
 * - Use the PLU to Item ID mapping in `plus.json` to determine the correct
 *   item ID for a given PLU (eg the PLU `11` has an item ID of `0`).
 * - Return the enriched cart on a `data` property
 *
 * Example response:
 * ```json
 * HTTP 200
 * {
 *   data: $enrichedCart
 * }
 * ```
 */
export interface CartData {
  brand: string;
  storeId: string;
  order: {
    items: OrderItem[];
  };
}
export interface OrderItem extends ItemHasPlu {
  modifiers: ItemHasPlu[];
}
export interface ItemHasPlu {
  plunum: string;
  id?: string;
}
export interface PlusFileData {
  data: {
    RestaurantPosData: { plus: string };
  };
}
export interface PluData {
  [key: string]: string;
}
export const getPluData = memoizeWith(
  () => "PLU singleton",
  () => {
    const {
      data: {
        RestaurantPosData: { plus: restaurantData },
      },
    }: PlusFileData = plusJson;
    const plus: PluData = JSON.parse(restaurantData);
    return plus;
  }
);
export async function cartHandler() {
  const cart: CartData = cartJson;
  const plus = getPluData();
  const items = cart.order.items.map((item) => {
    const modifiers = item.modifiers.map((mod) => {
      return {
        ...mod,
        id: plus[`plu_${mod.plunum}`],
      };
    });
    return {
      ...item,
      id: plus[`plu_${item.plunum}`],
      modifiers,
    };
  });
  const data = {
    cart: {
      ...cart,
      order: {
        ...cart.order,
        items,
      },
    },
  };

  return {
    body: JSON.stringify({
      data,
    }),
    statusCode: 200,
  };
}

/**
 * Problem #3: Compute min & max calories for a 4PC chicken combo
 * - Respond to `GET /4pc-chicken/calories` requests
 * - Compute the min & max _possible_ calories for a 4 piece chicken combo,
 *   according to the nutritional information in `./data/4pc-chicken.json` (see "Combo Data Structure" below)
 * - Return the min & max calories on a `data` property
 *
 * # Combo Data Structure
 * - A combo is composed of multiple _combo items_ (`comboItems`).
 * - For each item in the combo, the user must select a number of _options_ (`comboItemOptions`) equal to the amount required by the property `amountRequiredToSelect` on the combo item.
 * - Each option for a combo item has a `minAmount` and `maxAmount`, which dictate the min & max amounts of items that may be selected. For example an item with a min amount of 1 and a
 *   max amount of 1 is guaranteed to be included once (and only once) in the combo, and an item with a min amount of 0 and a max amount of 2 may be included 0, 1, or 2 times in the combo
 * - The min and max calories is a function of these restrictions on item selection within the combo
 *
 * Example response:
 * ```json
 * HTTP 200
 * {
 *   data: {
 *     maxCalories: 9001,
 *     minCalories: 8999,
 *   }
 * }
 * ```
 */
export interface ChickenData {
  comboItems: ComboItem[];
}
export interface ComboItem {
  amountRequiredToSelect: number;
  comboItemOptions: ComboItemOption[];
}
export interface ComboItemOption {
  minAmount: number;
  maxAmount: number;
  option: {
    nutrition: { calories: number };
  };
}
export const getChickenData : () => ChickenData = memoizeWith(
  () => "chicken singleton",
  () => {
    return chickenJson;
  }
);

export const getMinMaxCaloriesInItem = (item: ComboItem) => {
  const { amountRequiredToSelect } = item;
  const simplifiedOptions = sortBy(
    prop("calories"),
    map((option) => {
      const {
        minAmount,
        maxAmount,
        option: {
          nutrition: { calories },
        },
      } = option;
      return {
        minAmount,
        maxAmount,
        calories,
      };
    }, item.comboItemOptions)
  ) as [{
    minAmount : number;
    maxAmount : number;
    calories : number;
  }];

  // find min calories in options
  const {
    calories: minCalories,
  } = simplifiedOptions.reduce(
    (acc: { itemsSoFar: number; calories: number }, option) => {
      const { itemsSoFar, calories } = acc;
      if (itemsSoFar < amountRequiredToSelect) {
        const capacityLeft = Math.max(amountRequiredToSelect - itemsSoFar, 0);
        const quantity = Math.min(capacityLeft, option.maxAmount);
        const caloriesToAdd = quantity * option.calories;
        return {
          itemsSoFar: itemsSoFar + quantity,
          calories: calories + caloriesToAdd,
        };
      }
      return acc;
    },
    {
      itemsSoFar: 0,
      calories: 0,
    }
  ) as { calories: number };

  // find max calories in options
  const { calories: maxCalories } = reverse(
    simplifiedOptions
  ).reduce(
    (acc, option) => {
      const { itemsSoFar, calories } = acc;
      if (itemsSoFar < amountRequiredToSelect) {
        const capacityLeft = Math.max(amountRequiredToSelect - itemsSoFar, 0);
        const quantity = Math.min(capacityLeft, option.maxAmount);
        const caloriesToAdd = quantity * option.calories;
        return {
          itemsSoFar: itemsSoFar + quantity,
          calories: calories + caloriesToAdd,
        };
      }
      return acc;
    },
    {
      itemsSoFar: 0,
      calories: 0,
    }
  ) as { calories: number };

  return {
    minCalories,
    maxCalories,
  };
};

export async function calorieCounterHandler() {
  const chickenData : ChickenData = chickenJson;
  const data = chickenData.comboItems.reduce(
    (acc, item) => {
      const { minCalories, maxCalories } = getMinMaxCaloriesInItem(item);
      return {
        minCalories: acc.minCalories + minCalories,
        maxCalories: acc.maxCalories + maxCalories,
      };
    },
    { minCalories: 0, maxCalories: 0 }
  );
  return {
    body: JSON.stringify({
      data,
    }),
    statusCode: 200,
  };
}
