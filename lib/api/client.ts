import merge from "lodash/merge";
import { cacheExchange, createClient, fetchExchange } from "@urql/core";
import type { AnyVariables, DocumentInput, OperationResult } from "@urql/core";
import { registerUrql } from "@urql/next/rsc";
import { env } from "@/env";
import previewSession from "@/lib/sessions/preview";

interface QueryProps<T, P> {
  query: DocumentInput<T, P>;
  variables: P;
  previewToken?: string;
  fetchOptions?: RequestInit;
}

type APIClient = <Query, Variables extends AnyVariables = AnyVariables>(
  props: QueryProps<Query, Variables>
) => Promise<OperationResult<Query, Variables>>;

/**
 * Server-side Craft CMS GraphQL client. The endpoint is read from a
 * non-public env var, so it is never bundled for the browser.
 */
const queryAPI: APIClient = async ({
  query,
  variables,
  fetchOptions: inputFetchOptions,
  previewToken,
}) => {
  const token = previewToken ?? (await previewSession().token());
  const params = new URLSearchParams({});

  if (token) {
    params.set("token", token);
  }

  const { href: url } = new URL(`?${params.toString()}`, env.API_URL);

  const defaultFetchOptions: RequestInit = {
    cache: "force-cache",
    next: {
      // Never cache a preview request.
      revalidate: token ? 0 : undefined,
    },
  };
  const fetchOptions = merge({}, defaultFetchOptions, inputFetchOptions);

  if (typeof fetchOptions.next?.revalidate === "undefined") {
    delete fetchOptions.cache;
  }

  const makeClient = () =>
    createClient({
      url,
      exchanges: [cacheExchange, fetchExchange],
      fetchOptions,
    });

  const { getClient } = registerUrql(makeClient);

  return await getClient()
    .query(query, variables)
    .toPromise()
    .then((result) => {
      if (result.error) {
        console.warn(result.error.message);
      }
      return result;
    });
};

export default queryAPI;
