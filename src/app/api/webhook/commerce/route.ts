import { BillingInfo } from "@/hooks/types/commerce";
import { Order } from "@/hooks/useCommerce";
import * as brevo from "@getbrevo/brevo";

const ELMT_SHOP_LIST_ID = 67;

export async function POST(request: Request) {
  if (!process.env.BREVO_API_KEY) {
    return new Response("Endpoint unhealthy", { status: 500 });
  }

  if (process.env.NODE_ENV === "production") {
    // ensure it has the woocommerce headers
    const hasHeaders = !!request.headers.get("x-wc-webhook-signature") &&
      !!request.headers.get("x-wc-webhook-delivery-id") &&
      request.headers.get("x-wc-webhook-topic") === "order.updated";
    if (!hasHeaders) return new Response("Unauthorized", { status: 401 });
  }

  const order = await request.json() as Order;
  const customer = order.billing;

  if (order.status !== "on-hold") {
    return new Response("Bad Request", { status: 400 });
  }

  try {
    await sendOrderConfirmationEmail(customer, order);
  } catch (error: any) {
    console.error("Error sending order confirmation email", error);
  }

  const contactApi = new brevo.ContactsApi();
  contactApi.setApiKey(
    brevo.ContactsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY!
  );

  try {
    const { body: brevoContact } = await contactApi.getContactInfo(
      customer.email!
    );
    updateBrevoContact(contactApi, brevoContact, customer, order);
    return new Response("OK", {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    if (error instanceof brevo.HttpError) {
      const httpError = error as brevo.HttpError;
      if (httpError.response.statusCode === 404) {
        console.log("Brevo contact not found, creating new contact");
        await createBrevoContact(contactApi, customer, order);
        return new Response("OK", {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
    return new Response(
      JSON.stringify({
        error: error.message,
        detail: `Unable to update contact: ${error.stack}, ${
          error instanceof brevo.HttpError
        }`,
        exception: error,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

async function createBrevoContact(
  contactApi: brevo.ContactsApi,
  customer: BillingInfo,
  order: Order
): Promise<void> {
  const contact: brevo.CreateContact = {
    email: customer.email,
    listIds: [ELMT_SHOP_LIST_ID],
    attributes: {
      FIRSTNAME: customer.first_name,
      LASTNAME: customer.last_name,
      PHONE_NUMBER: customer.phone,
      ELMT_SHOP_ORDER_IDS: order.id,
    },
  };
  const newContact = await contactApi.createContact(contact);
  console.log("New Brevo contact created", newContact);
}

async function updateBrevoContact(
  contactApi: brevo.ContactsApi,
  brevoContact: brevo.GetExtendedContactDetails,
  customer: BillingInfo,
  order: Order
): Promise<void> {
  let updated = false;
  const listIds = brevoContact.listIds;
  if (!listIds.includes(ELMT_SHOP_LIST_ID)) {
    listIds.push(ELMT_SHOP_LIST_ID);
    updated = true;
  }
  let orderIds = (brevoContact.attributes as any).ELMT_SHOP_ORDER_IDS;
  if (!orderIds) {
    orderIds = order.id;
    updated = true;
  } else if (!orderIds.includes(order.id)) {
    orderIds = orderIds + "," + order.id;
    updated = true;
  }
  if (!updated) {
    console.warn(`Brevo contact already has list ID and order ID: ${orderIds}`);
    return;
  }

  const updateContact: brevo.UpdateContact = {
    listIds: listIds,
    attributes: {
      ELMT_SHOP_ORDER_IDS: orderIds,
    },
  };

  await contactApi.updateContact(brevoContact.email!, updateContact);
  console.log("Brevo contact updated with new list ID and order ID");
}

async function sendOrderConfirmationEmail(
  customer: BillingInfo,
  order: Order
): Promise<void> {
  const emailApi = new brevo.TransactionalEmailsApi();
  emailApi.setApiKey(
    brevo.TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY!
  );

  const sendSmtpEmail = new brevo.SendSmtpEmail();

  const orderAmount = order.meta_data.find(x => x.key === "amount")?.value;
  const transactionHash = order.meta_data.find(x => x.key === "transaction_hash")?.value;
  const dateModified = new Date(order.date_modified_gmt + "Z");

  sendSmtpEmail.subject = "Order Confirmation";
  sendSmtpEmail.htmlContent = `
  <html>
    <body>
      <h1>Order Confirmation - Element United</h1>
      <p>Hello ${customer.first_name},
        <br /><br />
        Thank you for your recent order of gold and/or silver coins in ELMT. We value your 
        trust in Element United and appreciate your commitment to a future built on 
        transparency and sustainability. Your E-Vault order is currently being processed. 
        Please be advised that there will be a short processing period to ensure the highest 
        standards of verification and preparation for your coin(s). Once your order is ready 
        for dispatch, you will receive a follow-up email containing detailed shipping and 
        tracking information.
      </p>
      <h2>Order Details</h2>
      <ul style="list-style-type: none; padding: 0; margin: 0;">
        <li style="margin-bottom: 10px;"><strong>Order No:</strong> ${order.number}</li>
        <li style="margin-bottom: 10px;"><strong>Order Total:</strong> ${orderAmount} ${order.currency}</li>
        <li style="margin-bottom: 10px;"><strong>Order Date:</strong> ${dateModified.toISOString()}</li>
        <li style="margin-bottom: 10px;">
          <strong>Transaction:</strong> 
          <a href="https://etherscan.io/tx/${transactionHash}">${transactionHash}</a>
        </li>
      </ul>
      <p>
        If you have any questions or require assistance, please do not 
        hesitate to contact us at <a href="mailto:support@elementunited.com">support@elementunited.com</a>. 
        Please include your applicable order information.
        Again, thank you for ordering from E-Vault and supporting Element United's mission.
        <br /><br />
        Sincerely,
        <br /><br />
        The Element United Team
      </p>
    </body>
  </html>
  `;
  sendSmtpEmail.to = [{ email: customer.email }];
  sendSmtpEmail.sender = { email: "noreply@elementunited.com", name: "Element United" };
  //sendSmtpEmail.replyTo = { email: "example@brevo.com", name: "sample-name" };
  //sendSmtpEmail.headers = { "Some-Custom-Name": "unique-id-1234" };
  // sendSmtpEmail.params = {
  //   parameter: "My param value",
  //   subject: "common subject",
  // };

  await emailApi.sendTransacEmail(sendSmtpEmail);
}
