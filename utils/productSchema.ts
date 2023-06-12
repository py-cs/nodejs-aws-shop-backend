import * as Yup from "yup";

export const productSchema = Yup.object().shape({
  title: Yup.string().required(),
  description: Yup.string().default(""),
  price: Yup.number().positive().required().defined(),
  count: Yup.number().positive().integer().required().defined(),
});
