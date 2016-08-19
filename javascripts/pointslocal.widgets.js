(function defineMustache(global,factory){if(typeof exports==="object"&&exports&&typeof exports.nodeName!=="string"){factory(exports)}else if(typeof define==="function"&&define.amd){define(["exports"],factory)}else{global.Mustache={};factory(global.Mustache)}})(this,function mustacheFactory(mustache){var objectToString=Object.prototype.toString;var isArray=Array.isArray||function isArrayPolyfill(object){return objectToString.call(object)==="[object Array]"};function isFunction(object){return typeof object==="function"}function typeStr(obj){return isArray(obj)?"array":typeof obj}function escapeRegExp(string){return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g,"\\$&")}function hasProperty(obj,propName){return obj!=null&&typeof obj==="object"&&propName in obj}var regExpTest=RegExp.prototype.test;function testRegExp(re,string){return regExpTest.call(re,string)}var nonSpaceRe=/\S/;function isWhitespace(string){return!testRegExp(nonSpaceRe,string)}var entityMap={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;","/":"&#x2F;","`":"&#x60;","=":"&#x3D;"};function escapeHtml(string){return String(string).replace(/[&<>"'`=\/]/g,function fromEntityMap(s){return entityMap[s]})}var whiteRe=/\s*/;var spaceRe=/\s+/;var equalsRe=/\s*=/;var curlyRe=/\s*\}/;var tagRe=/#|\^|\/|>|\{|&|=|!/;function parseTemplate(template,tags){if(!template)return[];var sections=[];var tokens=[];var spaces=[];var hasTag=false;var nonSpace=false;function stripSpace(){if(hasTag&&!nonSpace){while(spaces.length)delete tokens[spaces.pop()]}else{spaces=[]}hasTag=false;nonSpace=false}var openingTagRe,closingTagRe,closingCurlyRe;function compileTags(tagsToCompile){if(typeof tagsToCompile==="string")tagsToCompile=tagsToCompile.split(spaceRe,2);if(!isArray(tagsToCompile)||tagsToCompile.length!==2)throw new Error("Invalid tags: "+tagsToCompile);openingTagRe=new RegExp(escapeRegExp(tagsToCompile[0])+"\\s*");closingTagRe=new RegExp("\\s*"+escapeRegExp(tagsToCompile[1]));closingCurlyRe=new RegExp("\\s*"+escapeRegExp("}"+tagsToCompile[1]))}compileTags(tags||mustache.tags);var scanner=new Scanner(template);var start,type,value,chr,token,openSection;while(!scanner.eos()){start=scanner.pos;value=scanner.scanUntil(openingTagRe);if(value){for(var i=0,valueLength=value.length;i<valueLength;++i){chr=value.charAt(i);if(isWhitespace(chr)){spaces.push(tokens.length)}else{nonSpace=true}tokens.push(["text",chr,start,start+1]);start+=1;if(chr==="\n")stripSpace()}}if(!scanner.scan(openingTagRe))break;hasTag=true;type=scanner.scan(tagRe)||"name";scanner.scan(whiteRe);if(type==="="){value=scanner.scanUntil(equalsRe);scanner.scan(equalsRe);scanner.scanUntil(closingTagRe)}else if(type==="{"){value=scanner.scanUntil(closingCurlyRe);scanner.scan(curlyRe);scanner.scanUntil(closingTagRe);type="&"}else{value=scanner.scanUntil(closingTagRe)}if(!scanner.scan(closingTagRe))throw new Error("Unclosed tag at "+scanner.pos);token=[type,value,start,scanner.pos];tokens.push(token);if(type==="#"||type==="^"){sections.push(token)}else if(type==="/"){openSection=sections.pop();if(!openSection)throw new Error('Unopened section "'+value+'" at '+start);if(openSection[1]!==value)throw new Error('Unclosed section "'+openSection[1]+'" at '+start)}else if(type==="name"||type==="{"||type==="&"){nonSpace=true}else if(type==="="){compileTags(value)}}openSection=sections.pop();if(openSection)throw new Error('Unclosed section "'+openSection[1]+'" at '+scanner.pos);return nestTokens(squashTokens(tokens))}function squashTokens(tokens){var squashedTokens=[];var token,lastToken;for(var i=0,numTokens=tokens.length;i<numTokens;++i){token=tokens[i];if(token){if(token[0]==="text"&&lastToken&&lastToken[0]==="text"){lastToken[1]+=token[1];lastToken[3]=token[3]}else{squashedTokens.push(token);lastToken=token}}}return squashedTokens}function nestTokens(tokens){var nestedTokens=[];var collector=nestedTokens;var sections=[];var token,section;for(var i=0,numTokens=tokens.length;i<numTokens;++i){token=tokens[i];switch(token[0]){case"#":case"^":collector.push(token);sections.push(token);collector=token[4]=[];break;case"/":section=sections.pop();section[5]=token[2];collector=sections.length>0?sections[sections.length-1][4]:nestedTokens;break;default:collector.push(token)}}return nestedTokens}function Scanner(string){this.string=string;this.tail=string;this.pos=0}Scanner.prototype.eos=function eos(){return this.tail===""};Scanner.prototype.scan=function scan(re){var match=this.tail.match(re);if(!match||match.index!==0)return"";var string=match[0];this.tail=this.tail.substring(string.length);this.pos+=string.length;return string};Scanner.prototype.scanUntil=function scanUntil(re){var index=this.tail.search(re),match;switch(index){case-1:match=this.tail;this.tail="";break;case 0:match="";break;default:match=this.tail.substring(0,index);this.tail=this.tail.substring(index)}this.pos+=match.length;return match};function Context(view,parentContext){this.view=view;this.cache={".":this.view};this.parent=parentContext}Context.prototype.push=function push(view){return new Context(view,this)};Context.prototype.lookup=function lookup(name){var cache=this.cache;var value;if(cache.hasOwnProperty(name)){value=cache[name]}else{var context=this,names,index,lookupHit=false;while(context){if(name.indexOf(".")>0){value=context.view;names=name.split(".");index=0;while(value!=null&&index<names.length){if(index===names.length-1)lookupHit=hasProperty(value,names[index]);value=value[names[index++]]}}else{value=context.view[name];lookupHit=hasProperty(context.view,name)}if(lookupHit)break;context=context.parent}cache[name]=value}if(isFunction(value))value=value.call(this.view);return value};function Writer(){this.cache={}}Writer.prototype.clearCache=function clearCache(){this.cache={}};Writer.prototype.parse=function parse(template,tags){var cache=this.cache;var tokens=cache[template];if(tokens==null)tokens=cache[template]=parseTemplate(template,tags);return tokens};Writer.prototype.render=function render(template,view,partials){var tokens=this.parse(template);var context=view instanceof Context?view:new Context(view);return this.renderTokens(tokens,context,partials,template)};Writer.prototype.renderTokens=function renderTokens(tokens,context,partials,originalTemplate){var buffer="";var token,symbol,value;for(var i=0,numTokens=tokens.length;i<numTokens;++i){value=undefined;token=tokens[i];symbol=token[0];if(symbol==="#")value=this.renderSection(token,context,partials,originalTemplate);else if(symbol==="^")value=this.renderInverted(token,context,partials,originalTemplate);else if(symbol===">")value=this.renderPartial(token,context,partials,originalTemplate);else if(symbol==="&")value=this.unescapedValue(token,context);else if(symbol==="name")value=this.escapedValue(token,context);else if(symbol==="text")value=this.rawValue(token);if(value!==undefined)buffer+=value}return buffer};Writer.prototype.renderSection=function renderSection(token,context,partials,originalTemplate){var self=this;var buffer="";var value=context.lookup(token[1]);function subRender(template){return self.render(template,context,partials)}if(!value)return;if(isArray(value)){for(var j=0,valueLength=value.length;j<valueLength;++j){buffer+=this.renderTokens(token[4],context.push(value[j]),partials,originalTemplate)}}else if(typeof value==="object"||typeof value==="string"||typeof value==="number"){buffer+=this.renderTokens(token[4],context.push(value),partials,originalTemplate)}else if(isFunction(value)){if(typeof originalTemplate!=="string")throw new Error("Cannot use higher-order sections without the original template");value=value.call(context.view,originalTemplate.slice(token[3],token[5]),subRender);if(value!=null)buffer+=value}else{buffer+=this.renderTokens(token[4],context,partials,originalTemplate)}return buffer};Writer.prototype.renderInverted=function renderInverted(token,context,partials,originalTemplate){var value=context.lookup(token[1]);if(!value||isArray(value)&&value.length===0)return this.renderTokens(token[4],context,partials,originalTemplate)};Writer.prototype.renderPartial=function renderPartial(token,context,partials){if(!partials)return;var value=isFunction(partials)?partials(token[1]):partials[token[1]];if(value!=null)return this.renderTokens(this.parse(value),context,partials,value)};Writer.prototype.unescapedValue=function unescapedValue(token,context){var value=context.lookup(token[1]);if(value!=null)return value};Writer.prototype.escapedValue=function escapedValue(token,context){var value=context.lookup(token[1]);if(value!=null)return mustache.escape(value)};Writer.prototype.rawValue=function rawValue(token){return token[1]};mustache.name="mustache.js";mustache.version="2.2.1";mustache.tags=["{{","}}"];var defaultWriter=new Writer;mustache.clearCache=function clearCache(){return defaultWriter.clearCache()};mustache.parse=function parse(template,tags){return defaultWriter.parse(template,tags)};mustache.render=function render(template,view,partials){if(typeof template!=="string"){throw new TypeError('Invalid template! Template should be a "string" '+'but "'+typeStr(template)+'" was given as the first '+"argument for mustache#render(template, view, partials)")}return defaultWriter.render(template,view,partials)};mustache.to_html=function to_html(template,view,partials,send){var result=mustache.render(template,view,partials);if(isFunction(send)){send(result)}else{return result}};mustache.escape=escapeHtml;mustache.Scanner=Scanner;mustache.Context=Context;mustache.Writer=Writer});

function arrChunk(org,size) {
  var i,j,temparray,chunk = size;
  var chunks = [];
  for (i=0,j=org.length; i<j; i+=chunk) {
      temparray = org.slice(i,i+chunk);
      chunks.push(temparray);
  }
  return chunks;
}

var PointslocalTemplates = function() {
  this.templates = {
    'pointslocal.search': '<div class="plw-item plw-search"><div class=plw-cell><div class=plw-pseudo-drop><div class=plw-pseudo-drop-inner>What <i>{{{icon:chevron}}}</i></div><div class=plw-pseudo-drop-options><ul>{{#categories}}<li data-attribute=category_id data-value={{event_category_id}}>{{event_category_name}}</li>{{/categories}}</ul></div></div></div><div class=plw-cell><div class=plw-pseudo-drop><div class=plw-pseudo-drop-inner>Where <i>{{{icon:chevron}}}</i></div><div class=plw-pseudo-drop-options><ul>{{#categories}}<li><input type=checkbox> {{event_category_name}}</li>{{/categories}}</ul></div></div></div><div class=plw-cell><div class=plw-pseudo-drop><div class=plw-pseudo-drop-inner>When <i>{{{icon:chevron}}}</i></div><div class=plw-pseudo-drop-options><ul>{{#categories}}<li><input type=checkbox> {{event_category_name}}</li>{{/categories}}</ul></div></div></div><div class=plw-cell><input class=plw-textbox placeholder="Search, eg "> <i>{{{icon:microphone}}}</i></div><div class=plw-cell><a class=plw-button>Search</a></div></div><div class=widget-search-preview></div>',
    'pointslocal.search.results':'<div class=plw-item>{{#items}}<div class=plw-cell style=min-height:200px><div class=plw-cell-item>{{#image_id}}<div><img src="http://sfgate.pointslocal.com/image?method=image.icrop&id={{image_id}}&w=200&h=200&context=event.image"></div>{{/image_id}}</div><div class="plw-item-card plw-item-card-mini"><a class=plw-item-title>{{title}}</a><div>{{date}}, {{start_time}}</div></div></div>{{/items}}</div>',
    'pointslocal.upcoming': '{{#items}}<div class=plw-item>{{#image_id}}<div class=plw-cell><img src="http://sfgate.pointslocal.com/image?method=image.icrop&id={{image_id}}&w=100&h=100&context=event.image"></div>{{/image_id}}<div class=plw-cell><a class=plw-item-title href=http://sfgate.pointslocal.com/event/{{guid}}>{{title}}</a><div class=plw-item-meta>{{date}}, {{start_time}}</div></div></div>{{/items}}',
    'pointslocal.upcoming.medium': '{{#items}}<div class=plw-item>{{#image_id}}<div class="plw-cell plw-cell--3-col"><img src="http://sfgate.pointslocal.com/image?method=image.icrop&id={{image_id}}&w=200&h=200&context=event.image"></div>{{/image_id}}<div class="plw-cell plw-cell--9-col"><div class=plw-ribbon-container><div class="pick plw-ribbon">EDITOR\'S PICK</div></div><a class=plw-item-title href=http://sfgate.pointslocal.com/event/{{guid}}>{{title}}</a><div class=plw-item-meta>{{date}}, {{start_time}}</div><p>{{print_description}}</div></div>{{/items}}',
    'pointslocal.upcoming.large': '{{#items}}<div class=plw-row><div class=plw-ribbon-container><div class=plw-ribbon>FEATURED</div></div>{{#image_id}}<div class="plw-cell plw-cell--12-col"><img src="http://sfgate.pointslocal.com/image?method=image.icrop&id={{image_id}}&w=400&h=400&context=event.image"style=max-width:100%></div>{{/image_id}}<div class=plw-item-card><a class=plw-item-title>{{title}}</a> @ {{venue_name}}<div>{{date}}, {{start_time}}</div></div></div>{{/items}}',

    'gameplan.scoreboard.mini': '<script src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.11.4/jquery-ui.min.js"></script><div class="plw-row plw-gp-scoreboard plw-search"><div class="plw-cell plw-gp-header plw-cell--9-col">Scoreboard</div><div class="plw-cell plw-gp-header plw-cell--3-col"><div class=plw-pseudo-drop><div class=plw-pseudo-drop-inner>Sport <i><svg height=16 viewBox="0 0 1792 1792"width=16 xmlns=http://www.w3.org/2000/svg><path d="M1683 808l-742 741q-19 19-45 19t-45-19l-742-741q-19-19-19-45.5t19-45.5l166-165q19-19 45-19t45 19l531 531 531-531q19-19 45-19t45 19l166 165q19 19 19 45.5t-19 45.5z"></path></svg></i></div><div class=plw-pseudo-drop-options><ul>{{#sports}}<li data-attribute=sport data-value={{sport_guid}}>{{sport_name}}</li>{{/sports}}</ul></div></div><div class=plw-pseudo-drop><div class="plw-pseudo-drop-inner plw-pseudo-drop-datepicker-init">Date <i><svg height=16 viewBox="0 0 1792 1792"width=16 xmlns=http://www.w3.org/2000/svg><path d="M1683 808l-742 741q-19 19-45 19t-45-19l-742-741q-19-19-19-45.5t19-45.5l166-165q19-19 45-19t45 19l531 531 531-531q19-19 45-19t45 19l166 165q19 19 19 45.5t-19 45.5z"></path></svg></i></div><div class=plw-pseudo-drop-options style=width:400%;left:-300%><div data-attribute=sport data-value=""><div class=datepicker></div></div></div></div></div></div><div class=plw-row>{{^items}}<div class="plw-cell plw-cell--12-col">No Games Matched This Request</div>{{/items}}{{#items}}<div class="plw-cell plw-cell--4-col"><div class=plw-row><div class="plw-cell plw-cell--8-col">{{#away:has:image}}<img src="http://omaha.pointslocal.com/image?method=image.icrop&context=stats.image&id={{event_away_stats_entity_id}}&w=20&h=20"style=vertical-align:bottom>{{/away:has:image}}<a href=#>{{away_name}}</a> @</div><div class="plw-cell plw-cell--4-col">{{away_score}}</div></div><div class=plw-row><div class="plw-cell plw-cell--8-col">{{#home:has:image}}<img src="http://omaha.pointslocal.com/image?method=image.icrop&context=stats.image&id={{event_home_stats_entity_id}}&w=20&h=20"style=vertical-align:bottom>{{/home:has:image}} <a href=#>{{home_name}}</a></div><div class="plw-cell plw-cell--4-col">{{home_score}}</div></div><div class=plw-row><div class="plw-cell plw-cell--8-col"><span class=plw-gp-date>{{date}} @ {{time}}</span></div></div></div>{{/items}}</div><div class="plw-row plw-row--center"><div class="plw-cell plw-cell--6-col"><svg height=16 viewBox="0 0 1792 1792"width=16 xmlns=http://www.w3.org/2000/svg class="plw-control plw-control-prev"><path d="M1427 301l-531 531 531 531q19 19 19 45t-19 45l-166 166q-19 19-45 19t-45-19l-742-742q-19-19-19-45t19-45l742-742q19-19 45-19t45 19l166 166q19 19 19 45t-19 45z"></path></svg></div><div class="plw-cell plw-cell--6-col plw-navigate-next"><svg height=16 viewBox="0 0 1792 1792"width=16 xmlns=http://www.w3.org/2000/svg class="plw-control plw-control-next"style=float:right><path d="M1363 877l-742 742q-19 19-45 19t-45-19l-166-166q-19-19-19-45t19-45l531-531-531-531q-19-19-19-45t19-45l166-166q19-19 45-19t45 19l742 742q19 19 19 45t-19 45z"></path></svg></div></div>',
    'gameplan.scoreboard.extended': '{{#sports}}<div class="plw-row plw-gp-scoreboard plw-search"><div class="plw-cell plw-cell--12-col plw-gp-header">{{sport_name}}</div></div>{{^games}}<div class=plw-row><div class="plw-cell plw-cell--12-col">No games</div></div>{{/games}} {{#games}}<div class=plw-gp-scoreboard-game><div class=plw-row><div class="plw-cell plw-cell--10-col"><a href=#>{{away_name}}</a></div><div class="plw-cell plw-cell--2-col">{{away_score}}</div></div><div class=plw-row><div class="plw-cell plw-cell--10-col">@ <a href=#>{{home_name}}</a></div><div class="plw-cell plw-cell--2-col">{{home_score}}</div></div></div>{{/games}} {{/sports}}',
    'gameplan.team': '<div class="plw-gp plw-gp-team-card">{{#items}}<div class=plw-row><div class=plw-cell--4-col><img src="{{site}}/image?method=image.icrop&context=stats.image&id={{id}}&w=200&h=200"></div><div class=plw-cell--8-col><h2 class=plw-gp-team-header>{{name}}</h2><div class=plw-gp-team-card-team-page><a href="">Visit Team Page</a></div>{{#last_game}}<div class=plw-gp-team-card-game><b>Last Game:</b> {{title}}</div>{{/last_game}} {{#next_game}}<div class=plw-gp-team-card-game><b>Next Game:</b> {{title}}, {{date}} @ {{time}}</div>{{/next_game}}</div></div>{{/items}}</div>'
  }
}

var PointslocalIcons = function() {
  this.fill = '#ffffff';
  this.chevron = function() {
    return '<svg width="16" height="16" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M1683 808l-742 741q-19 19-45 19t-45-19l-742-741q-19-19-19-45.5t19-45.5l166-165q19-19 45-19t45 19l531 531 531-531q19-19 45-19t45 19l166 165q19 19 19 45.5t-19 45.5z"/></svg>';
  }
  this.microphone = function() {
    return '<svg width="16" height="16" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M1472 704v128q0 221-147.5 384.5t-364.5 187.5v132h256q26 0 45 19t19 45-19 45-45 19h-640q-26 0-45-19t-19-45 19-45 45-19h256v-132q-217-24-364.5-187.5t-147.5-384.5v-128q0-26 19-45t45-19 45 19 19 45v128q0 185 131.5 316.5t316.5 131.5 316.5-131.5 131.5-316.5v-128q0-26 19-45t45-19 45 19 19 45zm-256-384v512q0 132-94 226t-226 94-226-94-94-226v-512q0-132 94-226t226-94 226 94 94 226z"/></svg>';
  }
  this.search = function() {
    return '<svg width="16" height="16" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path style="fill:'+this.fill+'" d="M1216 832q0-185-131.5-316.5t-316.5-131.5-316.5 131.5-131.5 316.5 131.5 316.5 316.5 131.5 316.5-131.5 131.5-316.5zm512 832q0 52-38 90t-90 38q-54 0-90-38l-343-342q-179 124-399 124-143 0-273.5-55.5t-225-150-150-225-55.5-273.5 55.5-273.5 150-225 225-150 273.5-55.5 273.5 55.5 225 150 150 225 55.5 273.5q0 220-124 399l343 343q37 37 37 90z"/></svg>';
  }
}

var Pointslocal = function(element,opts,cb) {
  this.activeSites = {
    'sfgate': { 'domain': 'http://events.sfgate.com' }
  };
  this.site = '';
  this.type = '';
  this.element = '';
  this.template = '';
  this.rendered = '';
  this.templateSelector = false;
  this.opts = [];
  this.template;
  this.templateSet;
  this.maxMobileItems;
  this.maxItemsCSS = '';
  this.endpoint = '';
  this.APIParams = ['count','id','guid','recurring','venue','date','range','start','end','image'];
  self = this;

  this.resolveDomain = function() {
    var site = '';
    var dom = document.domain;
    switch(dom) {
      case 'sfgate.com':
        site = 'sfgate'
        break;
      default:
        site = '';
        break;
    }
    return site;
  }

  this.construct = function(opts) { console.log(opts); console.log('!!!!!!!!!'+document.domain);
    this.templateSet = new PointslocalTemplates;
    if (opts.template) {
      this.template = this.templateSet.templates[opts.template];
    }
    if (!opts.site) {
      opts.site = self.resolveDomain();
    }
    for (k in opts) {
      if (k === 'template') {
        continue;
      }
      this[k] = opts[k];
      this.opts[k] = opts[k]
    }
    if (this.templateSelector) {
      this.templateFromSelector();
    }
    if (this.widget === 'search') {

      this.type = 'search';
    }

    this.iconSet = new PointslocalIcons;
    this.get();
  }

  this.ping = function() {
    alert('ping!');
  }

  this.templateFromSelector = function() {
    this.template = $(self.templateSelector).html();
  }

  this.constructRequest = function(site,type,options) {
    return 'http://'+site+'.pointslocal.com/api/v1/'+type+'?'+options.join('&')+'&callback=?';
  };

  this.render = function(d) {
    self.rendered = Mustache.render(self.template, d);
    $(self.element).html(self.rendered);
    $(self.element).find('.plw-pseudo-drop-options li').on('click',function() {
      var opAttr = $(this).attr('data-attribute');
      var opVal = $(this).attr('data-value');
      self.opts[opAttr] = opVal;
      self.get();
    });
    $(self.element).find('.plw-control-next').on('click',function() {
      self.opts['offset'] = self.opts['offset'] + self.opts['count'];
      self.get();
    });
    $(self.element).find('.plw-control-prev').on('click',function() {
      self.opts['offset'] = self.opts['offset'] - self.opts['count'];
      self.get();
    });
    $(self.element).find('.plw-pseudo-drop-inner').on('click',function() {
      var show = ($(this).hasClass('active') ? false : true);
      $('.plw-pseudo-drop-inner').removeClass('active');
      if (show) { $(this).addClass('active'); }
    });
    $(self.element).find('.plw-pseudo-drop-datepicker-init').on('click',function() {

      $('.datepicker').datepicker({
          autoClose: true, 
          onSelect: function(ev) { $('.active').removeClass('active'); self.opts['date'] = ev; self.get(); } 
      })

    });

    if (self.cb) {
      setTimeout(self.cb(self), 1);
    }
  }

  this.get = function() {
    var c = [];
    for (k in this.opts) {
      if (k == 'templateSelector' || k === 'template' || k === 'chunk') {
        continue;
      }
      c.push(k+"="+this.opts[k]);
    }
    if (!self.type || self.type === '') {
      self.type = 'events';
    }

    var call = self.constructRequest(this.site,this.type,c);



    $.getJSON(call, (function(self) {
      // console.log(self.template);
        return function (d) {
          d['icon:chevron'] = self.iconSet.chevron();
          d['icon:microphone'] = self.iconSet.microphone();
          d['icon:search'] = self.iconSet.search();
          if (self.chunk && self.chunk.length > 0) {
            for (k in self.chunk) {
              // check!
              key = self.chunk[k].field;
              newKey = key + ':'
              tmp = arrChunk(d[key],self.chunk[k].groups);
              d[newKey+'groups'] = [];
              for (var i = 0; i < tmp.length; i++) {
                d[newKey+(i+1)] = tmp[i];
                d[newKey+'groups'].push(tmp[i]);
              }
            }
          }
          if (d.items) {
            var i = 1;
            for(k in d.items) {
              d.items[k]['site'] = 'http://'+self.site+'.pointslocal.com';
              d.items[k]['_classname'] = '';

              if (i > self.maxMobileItems) {
                d.items[k]['_classname'] = self.maxItemsCSS;
              }
              i++;
            }
          }

          if (self.companion) {
            var compOptions = [];
            for (k in self.companion.options) {
              compOptions.push(k+'='+self.companion.options[k]);
            }
            var compCall = self.constructRequest(self.site,self.companion.widget,compOptions);
            $.getJSON(compCall, function(cd) {
              for(ck in cd.items) {
                cd.items[ck]['site'] = 'http://'+self.site+'.pointslocal.com';
              }
              d[self.companion.key] = cd.items;
              self.render(d);
              console.log(d);
            })
            
          } else {
            self.render(d);
          }

          
        };
    })(this));

  }
  self.cb = cb;
  self.element = element;
  $(element).widget = self;
  this.construct(opts);

}