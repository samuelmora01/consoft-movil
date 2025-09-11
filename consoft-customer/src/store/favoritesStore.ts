import { create } from 'zustand';

export type FavoriteProduct = {
  id: string;
  title: string;
  material: string;
  image: string;
};

type FavoritesState = {
  items: FavoriteProduct[];
  toggle: (item: FavoriteProduct) => void;
  isSaved: (id: string) => boolean;
};

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  items: [],
  toggle: (item) => {
    const exists = get().items.some((p) => p.id === item.id);
    set({ items: exists ? get().items.filter((p) => p.id !== item.id) : [item, ...get().items] });
  },
  isSaved: (id) => get().items.some((p) => p.id === id),
}));





