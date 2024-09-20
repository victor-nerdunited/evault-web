export type Order = {
  id:                   number;
  parent_id:            number;
  status:               string;
  currency:             string;
  version:              string;
  prices_include_tax:   boolean;
  date_created:         Date;
  date_modified:        Date;
  discount_total:       string;
  discount_tax:         string;
  shipping_total:       string;
  shipping_tax:         string;
  cart_tax:             string;
  total:                string;
  total_tax:            string;
  customer_id:          number;
  order_key:            string;
  billing:              Ing;
  shipping:             Ing;
  payment_method:       string;
  payment_method_title: string;
  transaction_id:       string;
  customer_ip_address:  string;
  customer_user_agent:  string;
  created_via:          string;
  customer_note:        string;
  date_completed:       null;
  date_paid:            Date;
  cart_hash:            string;
  number:               string;
  meta_data:            MetaDatum[];
  line_items:           LineItem[];
  tax_lines:            any[];
  shipping_lines:       any[];
  fee_lines:            any[];
  coupon_lines:         any[];
  refunds:              any[];
  payment_url:          string;
  is_editable:          boolean;
  needs_payment:        boolean;
  needs_processing:     boolean;
  date_created_gmt:     Date;
  date_modified_gmt:    Date;
  date_completed_gmt:   null;
  date_paid_gmt:        Date;
  currency_symbol:      string;
  _links:               Links;
}

export type Links = {
  self:       Collection[];
  collection: Collection[];
}

export type Collection = {
  href: string;
}

export type Ing = {
  first_name: string;
  last_name:  string;
  company:    string;
  address_1:  string;
  address_2:  string;
  city:       string;
  state:      string;
  postcode:   string;
  country:    string;
  email?:     string;
  phone:      string;
}

export type LineItem = {
  id:           number;
  name:         string;
  product_id:   number;
  variation_id: number;
  quantity:     number;
  tax_class:    string;
  subtotal:     string;
  subtotal_tax: string;
  total:        string;
  total_tax:    string;
  taxes:        any[];
  meta_data:    MetaDatum[];
  sku:          string;
  price:        number;
  image:        Image;
  parent_name:  null;
}

export type Product = {
  id:                      number;
  name:                    string;
  slug:                    string;
  permalink:               string;
  date_created:            Date;
  date_created_gmt:        Date;
  date_modified:           Date;
  date_modified_gmt:       Date;
  type:                    string;
  status:                  string;
  featured:                boolean;
  catalog_visibility:      string;
  description:             string;
  short_description:       string;
  sku:                     string;
  price:                   string;
  regular_price:           string;
  sale_price:              string;
  date_on_sale_from:       null;
  date_on_sale_from_gmt:   null;
  date_on_sale_to:         null;
  date_on_sale_to_gmt:     null;
  on_sale:                 boolean;
  purchasable:             boolean;
  total_sales:             number;
  virtual:                 boolean;
  downloadable:            boolean;
  downloads:               any[];
  download_limit:          number;
  download_expiry:         number;
  external_url:            string;
  button_text:             string;
  tax_status:              string;
  tax_class:               string;
  manage_stock:            boolean;
  stock_quantity:          null;
  backorders:              string;
  backorders_allowed:      boolean;
  backordered:             boolean;
  low_stock_amount:        null;
  sold_individually:       boolean;
  weight:                  string;
  dimensions:              Dimensions;
  shipping_required:       boolean;
  shipping_taxable:        boolean;
  shipping_class:          string;
  shipping_class_id:       number;
  reviews_allowed:         boolean;
  average_rating:          string;
  rating_count:            number;
  upsell_ids:              any[];
  cross_sell_ids:          any[];
  parent_id:               number;
  purchase_note:           string;
  categories:              Category[];
  tags:                    any[];
  images:                  Image[];
  attributes:              Attribute[];
  default_attributes:      any[];
  variations:              any[];
  grouped_products:        any[];
  menu_order:              number;
  price_html:              string;
  related_ids:             any[];
  meta_data:               MetaDatum[];
  stock_status:            string;
  has_options:             boolean;
  post_password:           string;
  global_unique_id:        string;
  aioseo_notices:          any[];
  uagb_featured_image_src: any[];
  uagb_author_info:        UagbAuthorInfo;
  uagb_comment_info:       number;
  uagb_excerpt:            string;
  _links:                  Links;
}

export type Attribute = {
  id:        number;
  name:      string;
  slug:      string;
  position:  number;
  visible:   boolean;
  variation: boolean;
  options:   string[];
}

export type Category = {
  id:   number;
  name: string;
  slug: string;
}

export type Dimensions = {
  length: string;
  width:  string;
  height: string;
}

export type Image = {
  id:                number;
  date_created:      Date;
  date_created_gmt:  Date;
  date_modified:     Date;
  date_modified_gmt: Date;
  src:               string;
  name:              string;
  alt:               string;
}

export type MetaDatum = {
  id?:    number;
  key:   string;
  value: any;
}

export type UagbAuthorInfo = {
  display_name: string;
  author_link:  string;
}
