'use strict';

var hyperstream = require('hyperstream');

module.exports = htmlInjectMeta;

function crappilyEscapedEntities (str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function extractInputData (output, data) {
  var description = data.description;
  var title = data.name;
  var author;

  if (data.author) {
    if (typeof data.author === 'string') {
      author = data.author;
    } else if (typeof data.author.name === 'string') {
      author = data.author.name;
    }
  }

  if (title) {
    output.title = title;
    output.name['application-name'] = title;
    output.name.subject = title;
    output.name.abstract = title;
    output.property['og:title'] = title;
    output.name['twitter:title'] = title;
  }

  if (description) {
    output.name.description = description;
    output.name.subject = description;
    output.name.abstract = description;
    output.property['og:description'] = description;
    output.name['twitter:description'] = description;
  }

  if (author) {
    output.name.author = author;
    output.property['article:author'] = author;
    output.name['twitter:creator'] = author;
  }
}

function extractMetadataifyData (output, data) {
  if (!data) return;

  extractInputData(output, data);

  var url = data.url;
  var image = data.image;

  if (typeof url === 'string') {
    output.name['url'] = url;
    output.canonicalUrl = url;
    output.property['og:url'] = url;
    output.name['twitter:url'] = url;
  }

  if (typeof image === 'string') {
    output.property['og:image'] = image;
    output.name['twitter:image'] = image;
    output.name['twitter:card'] = 'summary_large_image';
  }

  if (typeof data.twitter === 'object') {
    var twitterFields = ['card', 'site', 'creator', 'title', 'description', 'image'];
    for (var i = 0; i < twitterFields.length; i++) {
      var field = twitterFields[i];

      if (typeof data.twitter[field] === 'string') {
        output.name['twitter:' + field] = data.twitter[field];
      }
    }
  }

  if (typeof data.canonicalUrl === 'string') {
    output.canonicalUrl = data.canonicalUrl;
  }
}

function fieldsToChanges (fields) {
  var changes = {};

  if (fields.title) {
    changes.title = {_html: crappilyEscapedEntities(fields.title)};
  }

  var metaTagsContent = '';

  var metaprops = ['name', 'property'];
  for (var i = 0; i < metaprops.length; i++) {
    var metaprop = metaprops[i];
    var props = fields[metaprop];

    var names = Object.keys(props);
    for (var j = 0; j < names.length; j++) {
      var name = crappilyEscapedEntities(names[j]).replace('&colon;', ':');
      var value = crappilyEscapedEntities(props[name]);

      metaTagsContent += '<meta ' + metaprop + '="' + name + '" content="' + value + '">\n';
    }
  }

  if (fields.canonicalUrl) {
    metaTagsContent += '<link rel="canonical" href="' + crappilyEscapedEntities(fields.canonicalUrl) + '">\n';
  }

  if (metaTagsContent.length > 0) {
    changes.head = {_appendHtml: metaTagsContent};
  }

  return changes;
}

function htmlInjectMeta (data) {
  data = data || {};

  var fields = {name: {}, property: {}, link: {}};

  extractInputData(fields, data);
  extractMetadataifyData(fields, data['html-inject-meta']);

  // Set a twitter card type if there's at *least* a title or a desription:
  if ((fields.name['twitter:title'] || fields.name['twitter:description']) && typeof fields.name['twitter:card'] !== 'string') {
    fields.name['twitter:card'] = 'summary';
  }

  return hyperstream(fieldsToChanges(fields));
}
