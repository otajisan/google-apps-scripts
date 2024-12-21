// https://developers.notion.com/reference/intro
const NOTION_API_URL_BASE = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

const NOTION_INTEGRATION_KEY = properties.getProperty('NOTION_INTEGRATION_KEY');
const NOTION_DATABASE_ID = properties.getProperty('NOTION_DATABASE_ID');


const requestNotionApi = (path, opts) => {
  opts['muteHttpExceptions'] = true;
  opts['headers'] = {
      'Notion-Version': NOTION_VERSION,
      'Authorization': `Bearer ${NOTION_INTEGRATION_KEY}`,
      'Content-Type': 'application/json'
    };

  const url = `${NOTION_API_URL_BASE}${path}`;
  try {
    const response = UrlFetchApp.fetch(url, opts);
    const code = response.getResponseCode();
    const result = JSON.parse(response.getContentText());
    //Logger.log(result);
    if (code != 200) {
      throw new Error('Notion API request failed.')
    }
    return result;
  } catch (ex) {
    Logger.log('===== Request Faild =====')
    Logger.log(ex);
    throw new Error(`something wrong. please check! Notion API url: ${url} opts: ${opts}`);
  }
};