const properties = PropertiesService.getScriptProperties();
const cache = CacheService.getScriptCache();
const CACHE_KEY = 'ALREADY_FETCHED';
const CACHE_TTL = 21600;
const SPREAD_SHEET_ID = properties.getProperty('SPREAD_SHEET_ID');


const  main = () => {
  const sheet = getSheet_(SPREAD_SHEET_ID);
  const rssList = readRssList_(sheet);
  Logger.log(`${rssList.length} urls found.`);

  const cached = getCache();

  rssList.map((rss) => {
    rssResults = fetchRss(rss['url']);
    Logger.log(`${rssResults.length} entries found.`);
    
    rssResults.map((entry) => {
      const pageId = md5sum(entry['title']);
      toNotion(pageId, entry, rss);
    });
  });
  
};

const getCache = () => {
  const cached = cache.get(CACHE_KEY);
  if (cached !== null && typeof cached !== 'undefined') {
    return JSON.parse(cached);
  }

  return [];
};

const saveCache = (value) => {
  cache.put(CACHE_KEY, JSON.stringify(value), CACHE_TTL);
};

const toNotion = (pageId, entry, rss) => {
  const cached = getCache();
  if (cached.indexOf(pageId) !== -1) {
    Logger.log(`cache found. page already exists. pageId: ${pageId}`);
    return;
  }

  const currentPage = searchPageByID_(pageId)

  if (currentPage != undefined) {
    Logger.log(`page found. page already exists. pageId: ${pageId}`);
    cached.push(pageId);
    saveCache(cached);
    return;
  }
  const newPage = createNewNotionPage_(entry, rss['category'], pageId);
  const newPageId = newPage['id'];
  Logger.log(`created new page. ${newPageId}`)
  const descriptionBlock = getDescriptionBlock_(getNotionPageBlocks_(newPageId));
  appendDescriptionBlock_(newPageId, descriptionBlock['id'], entry);
};

const getDescriptionBlock_ = (blocks) =>  blocks.filter((block) => 
     block['type'] == 'heading_1' && block['heading_1']['rich_text'][0]['text']['content'] == 'Description')[0];

const getNotionPageBlocks_ = (blockId) => {
  const notionApiPath = `/blocks/${blockId}/children`;
  const opts =  {'method': 'get'};

  const result = requestNotionApi(notionApiPath, opts);

  return result['results'];
};

const searchPageByID_ = (pageId) => {
  const notionApiPath = `/databases/${NOTION_DATABASE_ID}/query`;

  const payload = {
    'filter': {
      'and': [
        {
          'property': 'Page ID',
          'rich_text': {
            'equals': pageId
          },
        },
      ]     
    }
  };

  const opts = {
    'method': 'POST',
    'payload': JSON.stringify(payload),
  };

  const result = requestNotionApi(notionApiPath, opts);
  if (result['results'].length > 1) {
    throw Error('Something wrong! Multiple Notion pages found.');
  }

  return result['results'][0];
};

const createNewNotionPage_ = (entity, category, pageId) => {
  const notionApiPath = '/pages';

  const payload = {
    'parent': {
      'database_id': NOTION_DATABASE_ID,
    },
    'icon':{
      'emoji': '💡',
    },
    'properties': {
      'title': {
        'title': [
          {
            'text': {
              'content': entity['title']
            }
          }
        ]
      },
      'url': {
        'url': entity['link'],
      },
      'tags': {
        'multi_select': [
          {
            'name': category,
          }
        ]
      },
      'date': {
        'date': {
          'start': entity['pubDate'],
          'time_zone': null,
        }
      },
      'Page ID': {
        'rich_text': [
          {
            'text': {
              'content': pageId,
            },
          }
        ]
      },
    },
    'children': [
      {
        'object': 'block',
        'type': 'heading_1',
        'heading_1': {
          'color': 'purple_background',
          'rich_text': [{'text': {'content': 'General'}}],
        },
      },
      {
        'object': 'block',
        'type': 'heading_1',
        'heading_1': {
          'color': 'purple_background',
          'rich_text': [{'text': {'content': 'Description'}}],
        },
      },
    ],
  }
  
  const opts = {
    'method': 'POST',
    'payload': JSON.stringify(payload),
  };

  return requestNotionApi(notionApiPath, opts);
};

const appendDescriptionBlock_ = (pageId, after, entity) => {
  const notionApiPath = `/blocks/${pageId}/children`;
  const payload = {
    'after': after,
    'children': [
      {
        'object': 'block',
        'type': 'paragraph',
        'paragraph': {
          'rich_text': [
            {
              'type': 'text',
              'text': {
                'content': entity['description'],
              }
            }
          ]
        }
      },
    ]
  }

  const opts = {
    'method': 'patch',
    'payload': JSON.stringify(payload),
  };

  return requestNotionApi(notionApiPath, opts);
};

const getSheet_ = (spreadSheetId) => {
  const ss = SpreadsheetApp.openById(spreadSheetId);
  return ss.getSheetByName('list');
};

const readRssList_ = (sheet) => {
  const values = sheet.getRange('A:B').getValues();
  return values
    .filter((value) => value[0] !== '' && value[0] !== 'RSS URL')
    .map((value) => toSpreadSheetEntity_(value));
};

const toSpreadSheetEntity_ = (value) => {
  return {
    'url': value[0],
    'category': value[1],
  };
};