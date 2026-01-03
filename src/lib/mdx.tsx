import { compile, run } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import rehypePrettyCode from "rehype-pretty-code";
import { ComponentType } from "react";

const rehypePrettyCodeOptions = {
  theme: {
    dark: "github-dark",
    light: "github-light",
  },
  keepBackground: true,
};

type MDXComponents = Record<string, ComponentType<Record<string, unknown>>>;

export async function compileMDX(
  source: string,
  components?: MDXComponents
): Promise<ComponentType<Record<string, unknown>>> {
  const code = await compile(source, {
    outputFormat: "function-body",
    rehypePlugins: [[rehypePrettyCode, rehypePrettyCodeOptions]],
  });

  const { default: MDXContent } = await run(code, {
    ...runtime,
    baseUrl: import.meta.url,
  });

  if (components) {
    return function MDXWithComponents(props: Record<string, unknown>) {
      return MDXContent({ ...props, components });
    } as ComponentType<Record<string, unknown>>;
  }

  return MDXContent as ComponentType<Record<string, unknown>>;
}
