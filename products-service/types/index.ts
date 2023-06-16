export interface Product {
  id: string;
  title: string;
  price: number;
  description: string;
}

export interface Stock {
  product_id: string;
  count: number;
}
