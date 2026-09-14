import type { ComponentPropsWithoutRef, ElementType } from "react";

export type PolymorphicProps<E extends ElementType, OwnProps = object> = OwnProps & {
  as?: E;
} & Omit<ComponentPropsWithoutRef<E>, keyof OwnProps | "as">;
