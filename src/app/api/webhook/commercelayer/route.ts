import * as brevo from "@getbrevo/brevo";

const ELMT_SHOP_LIST_ID = 67;

export async function POST(request: Request) {
  if (!process.env.BREVO_API_KEY) {
    return new Response("Endpoint unhealthy", { status: 500 });
  }

  if (process.env.NODE_ENV === "production") {
    const signature = request.headers.get("x-commercelayer-signature");
    if (!signature) return new Response("Unauthorized", { status: 400 });
  }

  const contactApi = new brevo.ContactsApi();
  contactApi.setApiKey(
    brevo.ContactsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY!
  );

  const responseObj = await request.json();
  const order = responseObj.data;
  const customer = responseObj.included.find(
    (item: any) => item.type === "customers"
  );

  try {
    await sendOrderConfirmationEmail(customer, order);
  } catch (error: any) {
    console.error("Error sending order confirmation email", error);
  }

  try {
    const { body: brevoContact } = await contactApi.getContactInfo(
      customer.attributes.email
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
  customer: any,
  order: any
): Promise<void> {
  const contact: brevo.CreateContact = {
    email: customer.attributes.email,
    listIds: [ELMT_SHOP_LIST_ID],
    attributes: {
      FIRSTNAME: customer.attributes.metadata.first_name,
      LASTNAME: customer.attributes.metadata.last_name,
      PHONE_NUMBER: customer.attributes.metadata.phone,
      ELMT_SHOP_ORDER_IDS: order.id,
    },
  };
  const newContact = await contactApi.createContact(contact);
  console.log("New Brevo contact created", newContact);
}

async function updateBrevoContact(
  contactApi: brevo.ContactsApi,
  brevoContact: brevo.GetExtendedContactDetails,
  customer: any,
  order: any
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
  customer: any,
  order: any
): Promise<void> {
  const emailApi = new brevo.TransactionalEmailsApi();
  emailApi.setApiKey(
    brevo.TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY!
  );

  const sendSmtpEmail = new brevo.SendSmtpEmail();

  sendSmtpEmail.subject = "Order Confirmation";
  sendSmtpEmail.htmlContent = `
  <html>
    <body>
      <h1>Order Confirmation - Element United</h1>
      <p>Hello ${customer.attributes.metadata.first_name},
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
        <li style="margin-bottom: 10px;"><strong>Order No:</strong> ${order.attributes.number}</li>
        <li style="margin-bottom: 10px;"><strong>Order Amount:</strong> ${order.attributes.metadata.amount} ELMT</li>
        <li style="margin-bottom: 10px;"><strong>Order Date:</strong> ${new Date(order.attributes.placed_at).toLocaleString()}</li>
        <li style="margin-bottom: 10px;">
          <strong>Transaction:</strong> 
          <a href="https://etherscan.io/tx/${order.attributes.metadata.transaction_hash}">${order.attributes.metadata.transaction_hash}</a>
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
  sendSmtpEmail.to = [{ email: customer.attributes.email }];
  sendSmtpEmail.sender = { email: "noreply@elementunited.com", name: "Element United" };
  //sendSmtpEmail.replyTo = { email: "example@brevo.com", name: "sample-name" };
  //sendSmtpEmail.headers = { "Some-Custom-Name": "unique-id-1234" };
  // sendSmtpEmail.params = {
  //   parameter: "My param value",
  //   subject: "common subject",
  // };

  await emailApi.sendTransacEmail(sendSmtpEmail);
}
