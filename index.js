require('dotenv').config()
const { Scraper, Root, CollectContent } = require('nodejs-web-scraper');
const schedule = require('node-schedule');
const consola = require('consola');

(async () => {
  consola.info('Starting...');

  const config = {
    baseSiteUrl: `https://shop.kingdomdeath.com/`,
    startUrl: `https://shop.kingdomdeath.com/collections/expansions`,
    filePath: './images/',
    concurrency: 1,//Maximum concurrent jobs. More than 10 is not recommended.Default is 3.
    maxRetries: 3,//The scraper will try to repeat a failed request few times(excluding 404). Default is 5.
    logPath: './logs/', //Highly recommended: Creates a friendly JSON for each operation object, with all the relevant data.
    showConsoleLogs: false,
  }


  const scraper = new Scraper(config);//Create a new Scraper instance, and pass config to it.

  //Now we create the "operations" we need:

  const root = new Root();//The root object fetches the startUrl, and starts the process.

  const title = new CollectContent('#expansions #PageContainer .main-content #shopify-section-collection-template .grid__item:first-child p', (elm) => elm.textContent);

  root.addOperation(title);//Then we create a scraping "tree":

  schedule.scheduleJob('*/5 * * * *', async () =>{
    consola.info('Running job', new Date().toISOString());

    await scraper.scrape(root);

    if (!title || !title.data || !title.data[0] || title.data[0] !== 'Sorry, there are no products in this collection') {
      consola.info('Store is LIVE!!!!!!')

      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const client = require('twilio')(accountSid, authToken);

      client.messages
        .create({
          body: 'store is live',
          messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
          to: process.env.MY_PHONE_NUMBER,
        })
        .then(message => console.log(message.sid))
        .done();
    } else {
      consola.info('Store is not live :(')
    }
  });
})();
