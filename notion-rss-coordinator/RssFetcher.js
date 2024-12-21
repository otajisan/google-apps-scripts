const fetchRss = (url) => {
  const response = UrlFetchApp.fetch(url);
  const xml = XmlService.parse(response.getContentText());
  const entries = xml.getRootElement().getChild("channel").getChildren("item");

  const results = entries.map((entry) => toRssEntity_(entry));
  
  return results;
};

const toRssEntity_ = (entry) => {
  return {
    'title': entry.getChildText("title"),
    'link': entry.getChildText("link"),
    'description': entry.getChildText("description"),
    'pubDate': Utilities.formatDate(new Date(entry.getChild('pubDate').getText()), 'Asia/Tokyo', 'yyyy-MM-dd'),
  }
}