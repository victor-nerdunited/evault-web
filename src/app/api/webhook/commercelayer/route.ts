import * as brevo from '@getbrevo/brevo';

const ELMT_SHOP_LIST_ID = 67;

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    const signature = request.headers.get('x-commercelayer-signature');
    if (!signature) return new Response('Unauthorized', { status: 400 });
  }

  const contactApi = new brevo.ContactsApi();
  contactApi.setApiKey(brevo.ContactsApiApiKeys.apiKey, process.env.BREVO_API_KEY!);

  const responseObj = await request.json();
  const order = responseObj.data;
  const customer = responseObj.included.find((item: any) => item.type === 'customers');

  try {
    const { body: brevoContact } = await contactApi.getContactInfo(customer.attributes.email);
    updateBrevoContact(contactApi, brevoContact, customer, order);
    return new Response("OK", { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    if (error instanceof brevo.HttpError) {
      const httpError = error as brevo.HttpError;
      if (httpError.response.statusCode === 404) {
        console.log('Brevo contact not found, creating new contact');
        await createBrevoContact(contactApi, customer, order);
        return new Response("OK", { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
    }
  }

  return new Response("OK", { status: 200, headers: { 'Content-Type': 'application/json' } });
}

async function createBrevoContact(contactApi: brevo.ContactsApi, customer: any, order: any): Promise<void> {
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
  console.log('New Brevo contact created', newContact);
}

async function updateBrevoContact(contactApi: brevo.ContactsApi, brevoContact: brevo.GetExtendedContactDetails, customer: any, order: any): Promise<void> {
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
    orderIds = orderIds + ',' + order.id;
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
  
  try {
    await contactApi.updateContact(brevoContact.email!, updateContact);
    console.log('Brevo contact updated with new list ID and order ID');
  } catch (error) {
    console.error('Error updating Brevo contact:', error);
    throw error;
  }
}
