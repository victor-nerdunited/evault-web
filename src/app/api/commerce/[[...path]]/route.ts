
const wooCommerceUrl = process.env.WOOCOMMERCE_URL;
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
      "Authorization": "Basic " + Buffer.from(`${process.env.WOOCOMMERCE_KEY}:${process.env.WOOCOMMERCE_SECRET}`).toString("base64"),
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