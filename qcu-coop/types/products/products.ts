export type Products = {
  product_id: number;
  product_name: string;
  display_name: string;
  display_price: string;
  product_stocks: number;
  product_description: string;
  status: string;
  isFeatured: number;
  isDeleted: number;
  date_created: string;
  display_image: any;
  category_id: number;
  category_name: string;
  category_image: any;
};

export type Product = {
  product_id: number;
  product_name: string;
  display_name: string;
  display_price: string;
  product_stocks: number;
  product_description: string;
  status: string;
  isFeatured: number;
  isDeleted: number;
  date_created: string;
  display_image: any;
  category_id: number;
  category_name: string;
  category_image: any;
  albums: ProductAlbum[];
  variants: Variant[];
};

export type Variant = {
  product_id?: number;
  variant_id?: number;
  variant_name: string;
  variant_symbol: string;
  variant_price: number;
  variant_stocks: number;
};
export type Categories = {
  category_id: number;
  category_name: string;
  category_image: any;
};

export type ProductAlbum = {
  photo_id: number;
  product_id: number;
  product_photo: any;
};

export type Featured = {
  display_image: string;
  display_price: string;
  product_name: string;
  product_id: number;
};

export type DeletedProducts  = {
  product_id: number;
  product_name: string;
  product_stocks: number;
}
export type DeletedCategories = {
  category_id: number;
  category_name: string;
};
