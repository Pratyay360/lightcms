import type { Component } from "svelte";
import { render } from "svelte/server";

export const mailTemplate = (component: Component<any>) => {
  return (props: any) => {
    return render(component, { props }).body;
  };
};
