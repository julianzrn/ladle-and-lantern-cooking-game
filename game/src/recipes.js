// The menu of Ladle & Lantern: the raw ingredients, how each one is prepared, and the dishes
// the order board asks for. An item the cook carries is { type, stage } with stage one of
// 'raw', 'chopped', 'cooked', 'ready' (the bun needs nothing) or 'burnt'.

/** What each ingredient needs before it can go on a plate, and the component it becomes. */
export const INGREDIENTS = {
  bun: { name: 'Bun', needs: 'none', component: 'bun' },
  patty: { name: 'Beef patty', needs: 'cook', component: 'patty' },
  cheese: { name: 'Cheese', needs: 'chop', component: 'cheese' },
  tomato: { name: 'Tomato', needs: 'chop', component: 'tomato' },
  lettuce: { name: 'Lettuce', needs: 'chop', component: 'lettuce' },
  potato: { name: 'Potato', needs: 'chop and cook', component: 'fries' },
};

/** The dishes, from a quick side of fries to the full Lantern Deluxe. */
export const RECIPES = [
  { id: 'fries', name: 'Golden Fries', components: ['fries'], points: 60 },
  { id: 'salad', name: 'Market Salad', components: ['tomato', 'lettuce', 'cheese'], points: 95 },
  { id: 'burger', name: 'Lantern Burger', components: ['bun', 'patty', 'cheese'], points: 110 },
  { id: 'loaded', name: 'Loaded Fries', components: ['fries', 'cheese'], points: 115 },
  { id: 'garden', name: 'Garden Burger', components: ['bun', 'patty', 'lettuce', 'tomato'], points: 135 },
  { id: 'sunset', name: 'Sunset Stack', components: ['bun', 'patty', 'fries'], points: 145 },
  { id: 'deluxe', name: 'Lantern Deluxe', components: ['bun', 'patty', 'cheese', 'tomato', 'lettuce'], points: 175 },
];

/** The recipe with this id, or null. */
export function recipeById(id) {
  for (const recipe of RECIPES) if (recipe.id === id) return recipe;
  return null;
}

/**
 * The plate component a carried item counts as, or null while it still needs work:
 * a bun counts at once, a patty only once cooked, greens and cheese once chopped,
 * and a potato only once it has been cut and fried into fries. Burnt food counts as nothing.
 */
export function componentOfItem(item) {
  if (!item || item.kind !== 'item') return null;
  if (item.stage === 'burnt') return null;
  if (item.type === 'bun') return item.stage === 'ready' ? 'bun' : null;
  if (item.type === 'patty') return item.stage === 'cooked' ? 'patty' : null;
  if (item.type === 'potato') return item.stage === 'cooked' ? 'fries' : null;
  return item.stage === 'chopped' ? INGREDIENTS[item.type].component : null;
}

/** True when the item can go on a chopping board: a raw ingredient whose prep starts with a knife. */
export function canChopItem(item) {
  return Boolean(item && item.kind === 'item' && item.stage === 'raw'
    && (INGREDIENTS[item.type].needs === 'chop' || INGREDIENTS[item.type].needs === 'chop and cook'));
}

/** True when the item can go on the grill: a raw patty, or potato already cut into fries. */
export function canCookItem(item) {
  if (!item || item.kind !== 'item') return false;
  if (item.type === 'patty') return item.stage === 'raw';
  if (item.type === 'potato') return item.stage === 'chopped';
  return false;
}

/** True when two component lists hold the same components, in any order. */
export function sameComponents(a, b) {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
}

/** The recipe a finished plate matches, or null when no dish on the menu looks like that. */
export function recipeForComponents(components) {
  for (const recipe of RECIPES) if (sameComponents(recipe.components, components)) return recipe;
  return null;
}
