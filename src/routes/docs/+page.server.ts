import { redirect } from "@sveltejs/kit";

export const load = async () => {
  throw redirect(307, "https://docs.pratyay.qzz.io/guides/lightcms/1788281041/");
};
