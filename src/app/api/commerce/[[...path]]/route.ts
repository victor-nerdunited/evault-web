
const wooCommerceUrl = 'https://whitesmoke-cassowary-484409.hostingersite.com/wp-json/wc/v3';
export async function GET(request: Request, { params }: { params: { path: string[] }}): Promise<Response> {
  console.log('[api/commerce/get]', request.url)
  return await sendRequest("GET", request, params.path.join("/"));
}

export async function POST(request: Request, { params }: { params: { path: string[] }}): Promise<Response> {
  return await sendRequest("POST", request, params.path.join("/"));
}

export async function PUT(request: Request, { params }: { params: { path: string[] }}): Promise<Response> {
  return await sendRequest("PUT", request, params.path.join("/"));
}

const sendRequest = async (method: "GET" | "POST" | "PUT", request: Request, path: string): Promise<Response> => {
  const url = new URL(request.url);
  
  let fetchUrl = `${wooCommerceUrl}/${path}`;
  if (url.searchParams.size > 0) {
    fetchUrl += "?" + url.searchParams.toString();
  }

  let body = undefined;
  if (["POST", "PUT"].includes(method)) {
    body = await request.json();
    console.log(`[api/commerce] ${method}`, body);
  }

  console.log(`[api/commerce] ${method}`, fetchUrl);
  const response = await fetch(fetchUrl, {
    cache: "no-store",
    method: method,
    body: JSON.stringify(body),
    headers: {
      "Authorization": "Basic " + Buffer.from("ck_c93743ca4c70dcb848662f4fc3824efed6bba252:cs_b8744091dec07c58e86aefb8c58fcfd1ec87bffc").toString("base64"),
      "Content-Type": "application/json",
    }
  });
  console.log("[api/commerce] response", response.status);
  
  return new Response(response.body, {
    status: response.status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}